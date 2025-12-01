export default async (request, context) => {
  const url = new URL(request.url);

  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "*",
      },
    });
  }

  try {
    const proxyPath = request.headers.get("x-proxy-path");
    const targetApi = request.headers.get("x-target-api");

    if (!proxyPath) {
      return new Response(JSON.stringify({ error: "Missing x-proxy-path" }), {
        status: 400,
      });
    }

    let baseUrl = "https://generativelanguage.googleapis.com";
    if (targetApi === "groq") baseUrl = "https://api.groq.com";

    const finalUrl = baseUrl + proxyPath + url.search;

    // 复制 Headers，但剔除可能导致问题的字段
    const newHeaders = new Headers();
    for (const [key, value] of request.headers.entries()) {
      // 剔除 host, connection, content-length (fetch 会自动计算), 以及 netlify 特有头
      if (
        ![
          "host",
          "content-length",
          "connection",
          "x-nf-client-connection-ip",
        ].includes(key.toLowerCase())
      ) {
        newHeaders.set(key, value);
      }
    }

    const response = await fetch(finalUrl, {
      method: request.method,
      headers: newHeaders,
      body: request.body,
    });

    const resHeaders = new Headers(response.headers);
    resHeaders.set("Access-Control-Allow-Origin", "*");

    return new Response(response.body, {
      status: response.status,
      headers: resHeaders,
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  }
};
