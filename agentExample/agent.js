import OpenAI from "openai";
import "dotenv/config";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { expandProductKeywords, getWeather, searchRelatedWebsites, searchWebsites } from "./tools.js";

const apiKey = process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY;

if (!apiKey) {
  throw new Error(
    "Missing API key. Please set DEEPSEEK_API_KEY or OPENAI_API_KEY in your environment or .env file.",
  );
}

const openai = new OpenAI({
  baseURL: "https://api.deepseek.com",
  apiKey,
});
const model = "deepseek-chat";
const systemPrompt = `你是一个会调用工具的商业分析助手。
当任务需要查询、搜索、扩展关键词、获取外部信息时，优先调用已经提供的工具，而不是输出伪造的函数调用文本。
只允许使用这些工具名：searchWebsites、searchRelatedWebsites、expandProductKeywords、getWeather。
如果任务需要多步完成，请连续调用多个工具，直到拿到足够信息后再输出最终答案。
不要输出类似 <function_calls>、<invoke>、DSML 之类的伪工具调用标记。`;
const messages = [];

const tools = {
  searchWebsites: {
    schema: {
      type: "function",
      function: {
        name: "searchWebsites",
        description: "Search company or official websites related to given keywords in a target region via serper.dev",
        parameters: {
          type: "object",
          properties: {
            keywords: {
              type: "array",
              items: {
                type: "string",
              },
              description: "A list of search keywords, preferably industry terms, product terms, or company intent phrases",
            },
            region: {
              type: "string",
              description: "Target region or country, for example Maldives, China, United States, 马尔代夫",
            },
            site: {
              type: "string",
              description: "Optional domain restriction, for example linkedin.com or yellowpages.com.mv",
            },
            maxResults: {
              type: "number",
              description: "Maximum number of website results to return, up to 10",
            },
          },
          required: ["keywords"],
        },
      },
    },
    execute: async ({ keywords, region, site, maxResults }) => {
      return searchWebsites({ keywords, region, site, maxResults });
    },
  },
  searchRelatedWebsites: {
    schema: {
      type: "function",
      function: {
        name: "searchRelatedWebsites",
        description: "Search related websites from Google results via serper.dev using given keywords and optional target region",
        parameters: {
          type: "object",
          properties: {
            keywords: {
              type: "array",
              items: {
                type: "string",
              },
              description: "A list of keywords used to search related websites",
            },
            region: {
              type: "string",
              description: "Optional target region or country, for example Maldives or 马尔代夫",
            },
            site: {
              type: "string",
              description: "Optional domain restriction, for example zhihu.com or 36kr.com",
            },
            maxResults: {
              type: "number",
              description: "Maximum number of website results to return, up to 10",
            },
            limit: {
              type: "number",
              description: "Legacy alias for maximum number of website results to return, up to 10",
            },
          },
          required: ["keywords"],
        },
      },
    },
    execute: async ({ keywords, region, site, limit, maxResults }) => {
      return searchRelatedWebsites({ keywords, region, site, limit, maxResults });
    },
  },
  expandProductKeywords: {
    schema: {
      type: "function",
      function: {
        name: "expandProductKeywords",
        description: "Expand product and industry keywords into related search terms grouped by category",
        parameters: {
          type: "object",
          properties: {
            products: {
              type: "array",
              items: {
                type: "string",
              },
              description: "A list of product names, for example AI客服 or 智能外呼",
            },
            industryKeywords: {
              type: "array",
              items: {
                type: "string",
              },
              description: "A list of industry words, for example 教育, 电商, 医疗",
            },
            maxResults: {
              type: "number",
              description: "Maximum number of keywords per category",
            },
          },
          required: ["products"],
        },
      },
    },
    execute: async ({ products, industryKeywords, maxResults }) => {
      return expandProductKeywords({ products, industryKeywords, maxResults });
    },
  },
  getWeather: {
    schema: {
      type: "function",
      function: {
        name: "getWeather",
        description: "Get weather of a city",
        parameters: {
          type: "object",
          properties: {
            city: {
              type: "string",
              description: "The city to get the weather for",
            },
          },
          required: ["city"],
        },
      },
    },
    // 执行工具函数
    execute: async ({ city }) => {
      return await getWeather(city);
    },
  },
};

async function runAgent(userInput) {
  let finished = false;
  let finalContent = "";

  if (!messages.length) {
    messages.push({ role: "system", content: systemPrompt });
  }

  messages.push({ role: "user", content: userInput });

  while (!finished) {
    const response = await openai.chat.completions.create({
      model,
      messages,
      tools: Object.values(tools).map((tool) => tool.schema),
      tool_choice: "auto",
    });

    const message = response.choices[0].message;
    const toolCalls = message.tool_calls || [];

    if (!toolCalls.length) {
      messages.push(message);
      finalContent = message.content || "";
      finished = true;
      continue;
    }

    messages.push(message);
    for (const toolCall of toolCalls) {
      const name = toolCall.function.name;
      const args = JSON.parse(toolCall.function.arguments || "{}");
      let toolResult = null;

      if (tools[name]) {
        toolResult = await tools[name].execute(args);
        console.log("工具执行结果:", toolResult);
      } else {
        toolResult = JSON.stringify({ error: `未知工具: ${name}` });
      }

      messages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: typeof toolResult === "string" ? toolResult : JSON.stringify(toolResult),
      });
    }
  }

  console.log("最终回答:");
  process.stdout.write(`${finalContent}\n`);
}

async function main() {
  const rl = readline.createInterface({ input, output });

  while (true) {
    const userInput = await rl.question("你: ");
    if (!userInput.trim()) {
      continue;
    }

    if (["exit", "quit", "退出"].includes(userInput.trim().toLowerCase())) {
      rl.close();
      break;
    }

    await runAgent(userInput);
  }
}

main();

// 不采用 function calling 方式，而是采用直接调用工具的方式

// // 工具调用超时辅助函数
// async function callWithTimeout(fn, args, timeout = 10000) {
//   return Promise.race([
//     fn(...args),
//     new Promise((_, reject) =>
//       setTimeout(() => reject(new Error("工具调用超时")), timeout),
//     ),
//   ]);
// }

// // LLM 调用超时辅助函数
// async function callLLMWithTimeout(params, timeout = 15000) {
//   return Promise.race([
//     openai.chat.completions.create(params),
//     new Promise((_, reject) =>
//       setTimeout(() => reject(new Error("LLM 调用超时")), timeout),
//     ),
//   ]);
// }

// async function runAgent(userInput) {
//   const memory = [];
//   let finished = false;

//   while (!finished) {
//     let response;
//     try {
//       response = await callLLMWithTimeout({
//         model,
//         messages: [
//           {
//             role: "system",
//             content: `
// 你是一个 Agent，用户输入可能包含多个任务。请判断下一步需要调用哪个工具。
// 工具:
// 1. getWeather(city) - 返回城市天气
// 2. searchNews(topic) - 返回新闻
// 请输出 JSON:
// { "tool": "工具名", "args": { ... }, "next": "继续/完成" }
// `,
//           },
//           { role: "user", content: userInput },
//           { role: "assistant", content: JSON.stringify(memory) },
//         ],
//       });
//     } catch (err) {
//       console.error("LLM 调用失败或超时:", err.message);
//       break;
//     }

//     // Deepseek 可能返回非标准 JSON，用正则提取
//     let llmOutput;
//     try {
//       const text = response.choices[0].message.content;
//       const match = text.match(/\{[\s\S]*\}/);
//       if (!match) throw new Error("未找到 JSON");
//       llmOutput = JSON.parse(match[0]);
//     } catch (err) {
//       console.error(
//         "JSON 解析失败，原始输出:\n",
//         response.choices[0].message.content,
//       );
//       break;
//     }

//     // 调用工具
//     let result;
//     try {
//       const args = Object.values(llmOutput.args || {});
//       result = await callWithTimeout(tools[llmOutput.tool], args);
//     } catch (err) {
//       console.error("工具调用失败:", err.message);
//       result = `工具调用失败: ${err.message}`;
//     }

//     memory.push({ tool: llmOutput.tool, args: llmOutput.args, result });
//     finished = llmOutput.next === "完成";
//   }

//   // 生成最终答案
//   try {
//     const final = await openai.chat.completions.create({
//       model,
//       messages: [
//         { role: "system", content: "你是 Agent，根据 memory 生成最终答案。" },
//         { role: "user", content: userInput },
//         { role: "assistant", content: JSON.stringify(memory) },
//       ],
//     });
//     console.log("最终答案:\n", final.choices[0].message.content);
//   } catch (err) {
//     console.error("生成最终答案失败:", err.message);
//   }
// }

// // 示例调用
// runAgent("帮我查青岛天气");
