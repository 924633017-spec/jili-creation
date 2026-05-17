/* ══════════════════════════════════════════════
   Vercel Serverless — 空间文化诊断 API
   ══════════════════════════════════════════════ */

const FIELD_LIMITS = {
  contactName: 30,
  contactPhone: 20,
  city: 20,
  spaceType: 20,
  problem: 300,
  audience: 100,
  mood: 60,
  goal: 20,
};

function validate(body) {
  const requiredFields = [
    "contactName", "contactPhone", "city", "spaceType",
    "problem", "audience", "mood", "goal",
  ];
  for (const field of requiredFields) {
    const value = String(body[field] || "").trim();
    if (!value) return `${field} 不能为空`;
    const limit = FIELD_LIMITS[field];
    if (limit && value.length > limit) return `${field} 过长，请控制在 ${limit} 字以内`;
  }
  const phone = String(body.contactPhone || "").trim();
  if (!/^\+?[\d\s\-]{7,20}$/.test(phone)) return "联系电话格式不正确";
  return null;
}

export default async function handler(req, res) {
  /* CORS */
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const body = req.body;
    const validationError = validate(body);
    if (validationError) return res.status(400).json({ error: validationError });

    const apiKey = process.env.MOONSHOT_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: "Kimi API 密钥未配置，请先在 Vercel 项目设置中添加 MOONSHOT_API_KEY 环境变量。",
      });
    }

    const messages = [
      {
        role: "system",
        content:
          "你是几里造物的空间文化诊断助手。为文旅和商业空间项目生成简洁、专业、可执行的轻升级诊断。语气克制，避免空话。输出必须是结构化 JSON。",
      },
      {
        role: "user",
        content: `请基于以下项目信息，输出结构化诊断结果。

联系人：${body.contactName}
联系电话：${body.contactPhone}
城市：${body.city}
场地类型：${body.spaceType}
当前问题：${body.problem}
目标客群：${body.audience}
想要的空间气质：${body.mood}
最想提升：${body.goal}

要求：
1. judgement 用 1 段话概括空间当前最需要解决的核心问题。
2. theme 用一句短语概括文化母题。
3. directions 输出 3 条轻升级方向，每条都要具体、可感知、可沟通。
4. keywords 输出 4 到 6 个传播关键词。
5. summary 输出 1 段适合用于顾问式提案的总结。
6. 全部使用简体中文。
7. 不要输出 Markdown。`,
      },
    ];

    const result = await fetch("https://api.moonshot.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "kimi-k2-0711-preview",
        temperature: 0.55,
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "spatial_diagnosis",
            schema: {
              type: "object",
              properties: {
                judgement: { type: "string" },
                theme: { type: "string" },
                directions: {
                  type: "array",
                  items: { type: "string" },
                  minItems: 3, maxItems: 3,
                },
                keywords: {
                  type: "array",
                  items: { type: "string" },
                  minItems: 4, maxItems: 6,
                },
                summary: { type: "string" },
              },
              required: ["judgement", "theme", "directions", "keywords", "summary"],
              additionalProperties: false,
            },
          },
        },
        messages,
      }),
    });

    const data = await result.json();

    if (!result.ok) {
      return res.status(result.status).json({
        error: data?.error?.message || "Kimi 诊断生成失败，请稍后再试。",
      });
    }

    const content = data?.choices?.[0]?.message?.content;
    if (!content) {
      return res.status(502).json({ error: "Kimi 没有返回可用结果，请稍后再试。" });
    }

    let output;
    try {
      output = typeof content === "string" ? JSON.parse(content) : content;
    } catch {
      return res.status(502).json({ error: "诊断结果解析失败，请稍后再试。" });
    }

    if (!output?.judgement) {
      return res.status(502).json({ error: "Kimi 结果结构异常，请稍后再试。" });
    }

    return res.status(200).json(output);
  } catch (error) {
    return res.status(500).json({
      error: error?.message || "服务暂时不可用，请稍后再试。",
    });
  }
}
