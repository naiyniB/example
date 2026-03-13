const AMAP_KEY = process.env.AMAP_KEY;
const LLM_API_KEY = process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY;
const LLM_BASE_URL = process.env.LLM_BASE_URL || "https://api.deepseek.com";
const LLM_MODEL = process.env.KEYWORD_MODEL || "deepseek-chat";
const SERPER_API_KEY = process.env.SERPER_API_KEY;

function previewValue(value, maxLength = 300) {
  const text = typeof value === "string" ? value : JSON.stringify(value);

  if (!text) {
    return "";
  }

  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
}

function withToolLogging(toolName, handler) {
  return async (...args) => {
    const startedAt = Date.now();
    console.log(`[tool:${toolName}] start`);
    console.log(`[tool:${toolName}] args: ${previewValue(args.length <= 1 ? args[0] : args)}`);

    try {
      const result = await handler(...args);
      console.log(`[tool:${toolName}] success in ${Date.now() - startedAt}ms`);
      console.log(`[tool:${toolName}] result: ${previewValue(result)}`);
      return result;
    } catch (error) {
      console.error(`[tool:${toolName}] error in ${Date.now() - startedAt}ms: ${error.message}`);
      throw error;
    }
  };
}

function uniqueList(items) {
  return [...new Set(items.filter(Boolean).map((item) => item.trim()).filter(Boolean))];
}

function normalizeArrayInput(value) {
  if (Array.isArray(value)) {
    return uniqueList(value);
  }

  if (typeof value === "string") {
    return uniqueList(value.split(/[，,、\n]/));
  }

  return [];
}

function normalizeRegion(value) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function mapRegionToGoogleLocale(region) {
  const normalizedRegion = region.trim().toLowerCase();

  if (!normalizedRegion) {
    return { gl: "cn", hl: "zh-cn" };
  }

  if (["maldives", "mv", "马尔代夫"].includes(normalizedRegion)) {
    return { gl: "mv", hl: "en" };
  }

  if (["china", "cn", "中国"].includes(normalizedRegion)) {
    return { gl: "cn", hl: "zh-cn" };
  }

  if (["united states", "usa", "us", "美国"].includes(normalizedRegion)) {
    return { gl: "us", hl: "en" };
  }

  return { gl: "us", hl: "en" };
}

function buildSearchQuery(keywords, site, region) {
  const parts = [...keywords];

  if (region) {
    parts.push(region);
  }

  if (site) {
    parts.push(`site:${site}`);
  }

  return parts.join(" ").trim();
}

function buildKeywordGroup(products, industryKeywords, templates) {
  const results = [];

  for (const product of products) {
    for (const template of templates) {
      results.push(template.replaceAll("{product}", product));
    }
  }

  for (const keyword of industryKeywords) {
    for (const template of templates) {
      results.push(template.replaceAll("{product}", keyword));
    }
  }

  for (const product of products) {
    for (const keyword of industryKeywords) {
      results.push(`${keyword}${product}`);
      results.push(`${product}${keyword}`);
    }
  }

  return uniqueList(results);
}

function buildRuleBasedKeywordExpansion(products, industryKeywords, maxResults) {
  const categories = {
    core: uniqueList([
      ...products,
      ...industryKeywords,
      ...products.flatMap((product) => industryKeywords.map((keyword) => `${keyword}${product}`)),
    ]),
    demand: buildKeywordGroup(products, industryKeywords, [
      "{product}方案",
      "{product}系统",
      "{product}平台",
      "{product}服务",
      "{product}软件",
      "{product}供应商",
    ]),
    scenario: buildKeywordGroup(products, industryKeywords, [
      "{product}怎么选",
      "{product}哪个好",
      "{product}使用场景",
      "{product}落地方案",
      "{product}案例",
      "{product}最佳实践",
    ]),
    painPoint: buildKeywordGroup(products, industryKeywords, [
      "{product}提效",
      "{product}降本",
      "{product}转化提升",
      "{product}客户运营",
      "{product}自动化",
      "{product}增长",
    ]),
    transaction: buildKeywordGroup(products, industryKeywords, [
      "{product}价格",
      "{product}收费",
      "{product}报价",
      "{product}推荐",
      "{product}对比",
      "{product}哪家好",
    ]),
    longTail: uniqueList([
      ...products.flatMap((product) => industryKeywords.map((keyword) => `${keyword}${product}解决方案`)),
      ...products.flatMap((product) => industryKeywords.map((keyword) => `${keyword}${product}案例`)),
      ...products.flatMap((product) => industryKeywords.map((keyword) => `${keyword}${product}价格`)),
      ...products.flatMap((product) => industryKeywords.map((keyword) => `${keyword}${product}哪家好`)),
    ]),
  };

  return Object.fromEntries(
    Object.entries(categories).map(([key, values]) => [key, values.slice(0, maxResults)]),
  );
}

function buildKeywordResponse(products, industryKeywords, keywords, metadata = {}) {
  const allKeywords = uniqueList(Object.values(keywords).flat());

  return {
    input: {
      products,
      industryKeywords,
    },
    summary: {
      totalKeywords: allKeywords.length,
      categories: Object.fromEntries(
        Object.entries(keywords).map(([key, values]) => [key, values.length]),
      ),
    },
    metadata,
    keywords,
  };
}

function normalizeLlmKeywordPayload(payload, maxResults) {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const categoryNames = [
    "core",
    "demand",
    "scenario",
    "painPoint",
    "transaction",
    "longTail",
    "audience",
    "contentTopics",
    "synonyms",
  ];

  const keywords = {};

  for (const name of categoryNames) {
    keywords[name] = normalizeArrayInput(payload[name]).slice(0, maxResults);
  }

  return keywords;
}

async function generateLlmKeywordExpansion(products, industryKeywords, maxResults, ruleKeywords) {
  if (!LLM_API_KEY) {
    throw new Error("缺少 LLM API Key");
  }

  const prompt = [
    "你是一个资深的增长策划、SEO 策划和B2B营销顾问。",
    "请基于给定的产品词和行业词，联想并扩充更有业务语义的关键词。",
    "输出必须是 JSON 对象，不要输出 markdown，不要解释。",
    `每个分类最多输出 ${maxResults} 个短语，短语要简洁，避免重复。`,
    "分类包括：core, demand, scenario, painPoint, transaction, longTail, audience, contentTopics, synonyms。",
    "其中：",
    "core 是核心词和产品行业组合词。",
    "demand 是需求型词，如方案、系统、平台、服务。",
    "scenario 是使用场景、落地案例、最佳实践。",
    "painPoint 是提效、降本、转化、自动化等痛点导向词。",
    "transaction 是价格、收费、报价、推荐、对比、哪家好等商业转化词。",
    "longTail 是更具体、更长的组合搜索词。",
    "audience 是适用角色、人群、岗位相关词。",
    "contentTopics 是适合写文章、短视频、落地页的选题词。",
    "synonyms 是近义表达、替代表达。",
    `产品词：${JSON.stringify(products)}`,
    `行业词：${JSON.stringify(industryKeywords)}`,
    `已有规则扩展结果：${JSON.stringify(ruleKeywords)}`,
  ].join("\n");

  const response = await fetch(`${LLM_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${LLM_API_KEY}`,
    },
    body: JSON.stringify({
      model: LLM_MODEL,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "你擅长从产品和行业信息中提炼高质量营销关键词，并严格返回 JSON。",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.9,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`LLM 请求失败: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("LLM 未返回内容");
  }

  const parsed = JSON.parse(content);
  const normalized = normalizeLlmKeywordPayload(parsed, maxResults);

  if (!normalized) {
    throw new Error("LLM 返回结构无效");
  }

  return normalized;
}

function mergeKeywordSets(ruleKeywords, llmKeywords, maxResults) {
  const categories = uniqueList([
    ...Object.keys(ruleKeywords),
    ...Object.keys(llmKeywords || {}),
  ]);

  return Object.fromEntries(
    categories.map((category) => [
      category,
      uniqueList([...(ruleKeywords[category] || []), ...(llmKeywords?.[category] || [])]).slice(0, maxResults),
    ]),
  );
}

async function expandProductKeywordsImpl(input) {
  const products = normalizeArrayInput(input?.products);
  const industryKeywords = normalizeArrayInput(input?.industryKeywords);
  const maxResults = Number(input?.maxResults) > 0 ? Number(input.maxResults) : 12;

  if (!products.length) {
    return JSON.stringify(
      {
        error: "products 不能为空",
        example: {
          products: ["AI客服", "智能外呼"],
          industryKeywords: ["教育", "电商"],
        },
      },
      null,
      2,
    );
  }

  const ruleKeywords = buildRuleBasedKeywordExpansion(products, industryKeywords, maxResults);

  try {
    const llmKeywords = await generateLlmKeywordExpansion(
      products,
      industryKeywords,
      maxResults,
      ruleKeywords,
    );
    const mergedKeywords = mergeKeywordSets(ruleKeywords, llmKeywords, maxResults);

    return JSON.stringify(
      buildKeywordResponse(products, industryKeywords, mergedKeywords, {
        mode: "rule_plus_llm",
        llmEnhanced: true,
        model: LLM_MODEL,
      }),
      null,
      2,
    );
  } catch (error) {
    return JSON.stringify(
      buildKeywordResponse(products, industryKeywords, ruleKeywords, {
        mode: "rule_only_fallback",
        llmEnhanced: false,
        reason: error.message,
      }),
      null,
      2,
    );
  }
}

async function searchRelatedWebsitesImpl(input) {
  const keywords = normalizeArrayInput(input?.keywords);
  const site = typeof input?.site === "string" ? input.site.trim() : "";
  const region = normalizeRegion(input?.region);
  const requestedLimit = Number(input?.maxResults) > 0 ? Number(input.maxResults) : Number(input?.limit);
  const limit = requestedLimit > 0 ? Math.min(requestedLimit, 10) : 5;

  if (!keywords.length) {
    return JSON.stringify(
      {
        error: "keywords 不能为空",
        example: {
          keywords: ["教育AI客服", "智能外呼系统"],
          region: "马尔代夫",
          site: "",
          maxResults: 5,
        },
      },
      null,
      2,
    );
  }

  if (!SERPER_API_KEY) {
    return JSON.stringify(
      {
        error: "缺少 SERPER_API_KEY",
        message: "请在环境变量或 .env 文件中配置 SERPER_API_KEY",
      },
      null,
      2,
    );
  }

  const locale = mapRegionToGoogleLocale(region);
  const query = buildSearchQuery(keywords, site, region);

  const response = await fetch("https://google.serper.dev/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": SERPER_API_KEY,
    },
    body: JSON.stringify({
      q: query,
      num: limit,
      gl: locale.gl,
      hl: locale.hl,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    return JSON.stringify(
      {
        error: "Serper 请求失败",
        status: response.status,
        detail: errorText,
      },
      null,
      2,
    );
  }

  const data = await response.json();
  const organic = Array.isArray(data.organic) ? data.organic : [];
  const results = organic.slice(0, limit).map((item, index) => ({
    rank: index + 1,
    title: item.title || "",
    link: item.link || "",
    snippet: item.snippet || "",
    siteName: item.siteName || "",
  }));

  return JSON.stringify(
    {
      query,
      region,
      totalResults: results.length,
      results,
    },
    null,
    2,
  );
}

async function searchWebsitesImpl(input) {
  return searchRelatedWebsitesImpl(input);
}

async function getCityAdcode(city) {
  const districtUrl = `https://restapi.amap.com/v3/config/district?keywords=${encodeURIComponent(city)}&subdistrict=0&extensions=base&key=${AMAP_KEY}`;
  const districtRes = await fetch(districtUrl);
  const districtData = await districtRes.json();

  if (districtData.status !== "1") {
    throw new Error(`获取城市编码失败: ${districtData.info || "未知错误"}`);
  }

  const districts = districtData.districts || [];
  const matchedDistrict = districts.find((item) => item.adcode) || null;

  if (!matchedDistrict) {
    return null;
  }

  return matchedDistrict.adcode;
}

async function getWeatherImpl(city) {
  try {
    console.log("调用中");

    const adcode = await getCityAdcode(city);
    if (!adcode) {
      return `找不到城市: ${city}`;
    }

    // 2. 用 adcode 查询天气
    const weatherUrl = `https://restapi.amap.com/v3/weather/weatherInfo?city=${adcode}&key=${AMAP_KEY}`;
    const weatherRes = await fetch(weatherUrl);
    const weatherData = await weatherRes.json();

    if (weatherData.status !== "1") {
      console.log("获取天气失败");
      return `获取天气失败: ${weatherData.info}`;
    }

    const live = weatherData.lives[0];
    return `${city} (${live.city}) 当前天气：${live.weather}，温度 ${live.temperature}°C`;
  } catch (error) {
    console.log("系统错误");
    return `系统错误: ${error.message}`;
  }
}

export const expandProductKeywords = withToolLogging("expandProductKeywords", expandProductKeywordsImpl);
export const searchRelatedWebsites = withToolLogging("searchRelatedWebsites", searchRelatedWebsitesImpl);
export const searchWebsites = withToolLogging("searchWebsites", searchWebsitesImpl);
export const getWeather = withToolLogging("getWeather", getWeatherImpl);
