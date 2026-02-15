import OpenAI from 'openai';

let _openai;
function getClient() {
  if (!_openai) {
    if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY is not set.');
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _openai;
}

export async function analyzeProducts(products) {
  if (products.length === 0) return products;

  console.log(`\n🔍 Analyzing ${products.length} products for competition & niche potential...`);

  const productList = products.map((p, i) =>
    `${i + 1}. "${p.name}" — $${p.price}, ${p.orders} orders, ${p.rating}★, category: ${p.category}`
  ).join('\n');

  const prompt = `You are a dropshipping market analyst. Analyze each product for:

1. COMPETITION LEVEL on Amazon/Shopify/mainstream stores:
   - "low" = hard to find on Amazon, unique or niche
   - "medium" = exists on Amazon but not dominated by big brands
   - "high" = saturated, sold by many Amazon/Shopify sellers, big brands dominate

2. NICHE SCORE (1-10) for dropshipping potential:
   - 10 = perfect: low competition, high demand, good margins, impulse buy, easy to ship
   - 7-9 = great opportunity
   - 4-6 = decent but competitive
   - 1-3 = poor: saturated, low margins, or shipping issues

3. Brief reasoning (1 sentence)

Products to analyze:
${productList}

Respond ONLY with a valid JSON array. No markdown, no backticks.
[
  {
    "index": 1,
    "competitionLevel": "low",
    "nicheScore": 8,
    "reasoning": "Unique gadget not widely available on Amazon, high impulse buy potential"
  }
]`;

  try {
    const response = await getClient().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a dropshipping market analyst. Return only valid JSON arrays. Be realistic and critical.'
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.4,
      max_tokens: 3000
    });

    const raw = response.choices[0].message.content.trim();
    const cleaned = raw.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    const analysis = JSON.parse(cleaned);

    if (!Array.isArray(analysis)) throw new Error('Not an array');

    for (const a of analysis) {
      const idx = (a.index || 0) - 1;
      if (idx >= 0 && idx < products.length) {
        products[idx].competitionLevel = a.competitionLevel || 'unknown';
        products[idx].nicheScore = Math.min(10, Math.max(1, parseInt(a.nicheScore) || 5));
        products[idx].reasoning = (a.reasoning || '').trim();
      }
    }

    console.log('✅ Competition & niche analysis complete');
    return products;

  } catch (err) {
    console.error(`❌ Analysis failed: ${err.message}`);
    return products.map(p => ({
      ...p,
      competitionLevel: p.competitionLevel || 'unknown',
      nicheScore: p.nicheScore || 5,
      reasoning: p.reasoning || ''
    }));
  }
}

export async function generateWeeklyReport(history, trends, currentDay) {
  console.log('\n📊 Generating weekly deep analysis report...');

  const allProducts = history.products.filter(p => p.day > currentDay - 7);
  const trendData = Object.values(trends.tracked);
  const rising = trendData.filter(t => t.trend === '📈 rising');
  const topByNiche = [...allProducts].sort((a, b) => (b.nicheScore || 0) - (a.nicheScore || 0)).slice(0, 5);
  const lowCompetition = allProducts.filter(p => p.competitionLevel === 'low');

  const summary = `Products analyzed this week: ${allProducts.length}
Top categories: ${[...new Set(allProducts.map(p => p.category))].join(', ')}
Rising products: ${rising.length}
Low competition finds: ${lowCompetition.length}
Top niche scores: ${topByNiche.map(p => `${p.name} (${p.nicheScore}/10)`).join(', ')}`;

  const prompt = `You are a senior dropshipping strategist. Write a brief weekly market intelligence report based on this data:

${summary}

All products found this week:
${allProducts.map(p => `- ${p.name} | $${p.price} | ${p.orders} orders | Competition: ${p.competitionLevel} | Niche: ${p.nicheScore}/10`).join('\n')}

Rising trends:
${rising.map(r => `- ${r.name}: appeared ${r.appearances.length} times, orders growing`).join('\n') || 'None yet'}

Write a concise report covering:
1. TOP 3 OPPORTUNITIES this week (with why)
2. CATEGORIES to watch next week
3. PRODUCTS TO AVOID (high competition)
4. EMERGING TRENDS spotted
5. One bold PREDICTION for next week

Keep it under 400 words. Be specific, actionable, and direct.`;

  try {
    const response = await getClient().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a senior dropshipping market strategist. Be direct, specific, and actionable.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });

    return response.choices[0].message.content.trim();
  } catch (err) {
    console.error(`❌ Weekly report failed: ${err.message}`);
    return null;
  }
}
