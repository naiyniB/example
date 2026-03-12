import OpenAI from "openai";
import "dotenv/config";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { getWeather } from "./tools.js";

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
const messages = [];

const tools = {
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
  messages.push({ role: "user", content: userInput });

  while (!finished) {
    // 让 LLM 思考，并生成工具调用
    const response = await openai.chat.completions.create({
      model: model, // 确保 model 已定义
      messages,
      tools: [tools.getWeather.schema], // 提供工具定义
      tool_choice: "auto", // 自动调用工具
    });

    // 获取 LLM 返回的 tool_call
    const message = response.choices[0].message;
    const toolCall = message.tool_calls?.[0];
    if (!toolCall) {
      messages.push(message);
      finished = true;
      continue;
    }

    messages.push(message);
    if (toolCall) {
      // 执行工具
      const name = toolCall.function.name;
      const args = JSON.parse(toolCall.function.arguments || "{}");
      let toolResult = null;

      // 执行工具函数
      if (tools[name]) {
        toolResult = await tools[name].execute(args);
        console.log("工具执行结果:", toolResult);
      }

      // 记录工具结果
      messages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: toolResult,
      });

      // 判断是否完成
      if (toolResult.includes("天气")) {
        finished = true; // 任务完成
        messages.push({
          role: "assistant",
          content: `任务完成：${toolResult}`,
        });
      }
    }
  }

  // 返回最终结果
  const finalStream = await openai.chat.completions.create({
    model: model, // 确保 model 已定义
    messages,
    stream: true,
  });
  let finalContent = "";
  console.log("最终回答:");
  for await (const chunk of finalStream) {
    const delta = chunk.choices?.[0]?.delta?.content || "";
    if (!delta) continue;
    finalContent += delta;
    process.stdout.write(delta);
  }
  process.stdout.write("\n");
  messages.push({ role: "assistant", content: finalContent });
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
