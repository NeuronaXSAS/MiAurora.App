/**
 * Aurora App - Financial Chat AI API
 * 
 * Processes financial planning conversations and extracts
 * relevant data to update user's financial metrics.
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { isSameOriginRequest, readSession } from "@/lib/server-session";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Financial data extraction patterns
const INCOME_PATTERNS = [
  /(?:earn|make|salary|income|paid)\s*(?:is|of|about|around)?\s*\$?([\d,]+)/i,
  /\$?([\d,]+)\s*(?:per|a|\/)\s*(?:month|mo)/i,
  /(?:monthly|annual)\s*(?:income|salary)\s*(?:is|of)?\s*\$?([\d,]+)/i,
];

const EXPENSE_PATTERNS = [
  /(?:spend|expenses?|costs?)\s*(?:is|are|about|around)?\s*\$?([\d,]+)/i,
  /\$?([\d,]+)\s*(?:in|on)\s*(?:expenses?|bills?|costs?)/i,
  /(?:monthly)\s*(?:expenses?|spending)\s*(?:is|are)?\s*\$?([\d,]+)/i,
];

const SAVINGS_PATTERNS = [
  /(?:save|saved|savings?)\s*(?:is|of|about|around)?\s*\$?([\d,]+)/i,
  /\$?([\d,]+)\s*(?:in|of)\s*(?:savings?)/i,
  /(?:have|got)\s*\$?([\d,]+)\s*(?:saved)/i,
];

const DEBT_PATTERNS = [
  /(?:debt|owe|owing)\s*(?:is|of|about|around)?\s*\$?([\d,]+)/i,
  /\$?([\d,]+)\s*(?:in|of)\s*(?:debt|loans?|credit)/i,
];

const GOAL_PATTERNS = [
  /(?:goal|target|want to save)\s*(?:is|of)?\s*\$?([\d,]+)/i,
  /(?:save|saving)\s*(?:for|towards)?\s*\$?([\d,]+)/i,
];

function extractNumber(text: string, patterns: RegExp[]): number | undefined {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const num = parseInt(match[1].replace(/,/g, ""), 10);
      if (!isNaN(num) && num > 0) {
        return num;
      }
    }
  }
  return undefined;
}

function extractFinancialData(message: string): {
  income?: number;
  expenses?: number;
  savingsGoal?: number;
  currentSavings?: number;
  debtAmount?: number;
  budgetCategory?: string;
  actionType?: string;
} {
  const data: ReturnType<typeof extractFinancialData> = {};

  data.income = extractNumber(message, INCOME_PATTERNS);
  data.expenses = extractNumber(message, EXPENSE_PATTERNS);
  data.currentSavings = extractNumber(message, SAVINGS_PATTERNS);
  data.debtAmount = extractNumber(message, DEBT_PATTERNS);
  data.savingsGoal = extractNumber(message, GOAL_PATTERNS);

  // Detect action type
  if (/budget|budgeting/i.test(message)) {
    data.actionType = "budget";
  } else if (/save|saving|emergency fund/i.test(message)) {
    data.actionType = "savings";
  } else if (/invest|investing|investment/i.test(message)) {
    data.actionType = "investment";
  } else if (/debt|loan|credit card/i.test(message)) {
    data.actionType = "debt";
  } else if (/salary|negotiate|raise/i.test(message)) {
    data.actionType = "career";
  }

  // Detect budget category
  if (/rent|housing|mortgage/i.test(message)) {
    data.budgetCategory = "housing";
  } else if (/food|groceries|eating/i.test(message)) {
    data.budgetCategory = "food";
  } else if (/transport|car|gas|commute/i.test(message)) {
    data.budgetCategory = "transportation";
  } else if (/entertainment|fun|leisure/i.test(message)) {
    data.budgetCategory = "entertainment";
  }

  return data;
}

function generateFinancialResponse(message: string, extractedData: ReturnType<typeof extractFinancialData>): string {
  const lowerMessage = message.toLowerCase();

  // Budget help
  if (/budget|budgeting/i.test(lowerMessage)) {
    if (extractedData.income && extractedData.expenses) {
      const savings = extractedData.income - extractedData.expenses;
      const savingsRate = ((savings / extractedData.income) * 100).toFixed(1);
      return `Great! Based on your income of $${extractedData.income} and expenses of $${extractedData.expenses}, you're saving $${savings} per month (${savingsRate}% savings rate).

${parseFloat(savingsRate) >= 20 ? "🎉 Excellent! You're above the recommended 20% savings rate!" : parseFloat(savingsRate) >= 10 ? "👍 Good progress! Try to reach 20% for optimal financial health." : "💡 Tip: The 50/30/20 rule suggests 50% for needs, 30% for wants, and 20% for savings."}

Would you like me to help you:
• Create a detailed budget breakdown?
• Find areas to reduce expenses?
• Set up savings goals?`;
    }
    return `I'd love to help you create a budget! 📊

To get started, could you tell me:
1. What's your monthly income (after taxes)?
2. What are your main monthly expenses?

Once I know these, I can help you create a personalized budget using the 50/30/20 rule:
• 50% for needs (rent, utilities, groceries)
• 30% for wants (entertainment, dining out)
• 20% for savings and debt repayment`;
  }

  // Emergency fund
  if (/emergency fund|emergency savings/i.test(lowerMessage)) {
    if (extractedData.expenses) {
      const target3mo = extractedData.expenses * 3;
      const target6mo = extractedData.expenses * 6;
      return `Based on your monthly expenses of $${extractedData.expenses}, here's your emergency fund target:

🎯 Minimum goal: $${target3mo.toLocaleString()} (3 months)
🎯 Ideal goal: $${target6mo.toLocaleString()} (6 months)

${extractedData.currentSavings ? `With $${extractedData.currentSavings} saved, you have ${(extractedData.currentSavings / extractedData.expenses).toFixed(1)} months covered.` : ""}

Tips to build your emergency fund:
• Start with a small, achievable goal ($500-$1,000)
• Set up automatic transfers to a separate savings account
• Put any windfalls (tax refunds, bonuses) directly into savings

Would you like me to create a savings plan to reach your goal?`;
    }
    return `An emergency fund is your financial safety net! 🛡️

The general recommendation is to save 3-6 months of living expenses. To calculate your target, I need to know your monthly expenses.

What are your typical monthly expenses (rent, utilities, food, transportation, etc.)?`;
  }

  // Debt help
  if (/debt|owe|loan|credit card/i.test(lowerMessage)) {
    if (extractedData.debtAmount) {
      return `I understand you have $${extractedData.debtAmount.toLocaleString()} in debt. Let's work on a plan to tackle it! 💪

Here are two popular strategies:

**Avalanche Method** (saves most money):
Pay minimums on all debts, put extra toward highest interest rate first.

**Snowball Method** (builds momentum):
Pay minimums on all debts, put extra toward smallest balance first.

${extractedData.income ? `With your income of $${extractedData.income}, I recommend allocating at least ${Math.min(20, Math.round((extractedData.debtAmount / 12) / extractedData.income * 100))}% toward debt repayment.` : ""}

Would you like me to:
• Create a debt payoff timeline?
• Suggest ways to reduce expenses to pay off debt faster?
• Calculate how much you could save in interest?`;
    }
    return `I'm here to help you manage debt! 💳

To create a personalized debt payoff plan, could you tell me:
1. How much total debt do you have?
2. What types of debt (credit cards, student loans, etc.)?
3. What are the interest rates?

Remember: Having debt doesn't mean you're bad with money. Many women face debt due to systemic issues like the wage gap. Let's work together to create a plan!`;
  }

  // Salary negotiation
  if (/salary|negotiate|raise|pay/i.test(lowerMessage)) {
    return `Great question! Salary negotiation is one of the most impactful financial moves you can make. 💼

**Key tips for women negotiating salary:**

1. **Research thoroughly** - Use Glassdoor, LinkedIn, and industry reports to know your market value

2. **Document your achievements** - Keep a "brag file" of accomplishments, metrics, and positive feedback

3. **Practice your pitch** - Rehearse with a friend or mentor

4. **Use specific numbers** - Ask for a specific amount, not a range

5. **Consider the full package** - Negotiate benefits, remote work, PTO, not just salary

**Powerful phrases to use:**
• "Based on my research and contributions, I'm looking for..."
• "I'm excited about this role. Can we discuss compensation?"
• "What flexibility is there in the salary range?"

Women who negotiate earn on average 7% more than those who don't. You've got this! 🌟

Would you like tips specific to your industry or situation?`;
  }

  // Investment basics
  if (/invest|investing|investment|stock|401k|ira/i.test(lowerMessage)) {
    return `Investing is how you build long-term wealth! 📈

**Getting started with investing:**

1. **Emergency fund first** - Have 3-6 months expenses saved before investing

2. **Employer 401(k)** - If your employer matches, contribute at least enough to get the full match (it's free money!)

3. **Roth IRA** - Great for young women; contributions grow tax-free

4. **Index funds** - Low-cost, diversified way to invest in the market

**Key principles:**
• Start early - Time in the market beats timing the market
• Diversify - Don't put all eggs in one basket
• Stay consistent - Regular contributions matter more than perfect timing
• Think long-term - Ignore short-term market noise

${extractedData.currentSavings ? `With $${extractedData.currentSavings} in savings, you might consider investing any amount above your emergency fund.` : ""}

Would you like me to explain any of these options in more detail?`;
  }

  // Reduce expenses
  if (/reduce|cut|lower|save more|expenses/i.test(lowerMessage)) {
    return `Here are practical ways to reduce expenses without sacrificing quality of life! 💡

**Quick wins:**
• Review subscriptions - Cancel unused ones
• Negotiate bills - Call providers for better rates
• Meal prep - Reduce food waste and takeout
• Use cashback apps - Rakuten, Ibotta, etc.

**Bigger impact:**
• Housing - Consider roommates or relocating
• Transportation - Public transit, carpooling, or biking
• Insurance - Shop around annually for better rates
• Phone plan - Switch to budget carriers

**The "No-Spend" challenge:**
Try a week of only essential spending to identify habits.

${extractedData.expenses ? `With $${extractedData.expenses} in monthly expenses, even a 10% reduction would save you $${Math.round(extractedData.expenses * 0.1)} per month ($${Math.round(extractedData.expenses * 0.1 * 12)} per year)!` : ""}

What category would you like to focus on first?`;
  }

  // Default helpful response
  return `I'm here to help with your financial wellness! 💰

I can assist you with:
• **Budgeting** - Create a personalized spending plan
• **Saving** - Build an emergency fund and reach goals
• **Debt** - Strategies to pay off debt faster
• **Investing** - Basics of growing your wealth
• **Career** - Salary negotiation tips

Just tell me what's on your mind, or share some numbers (income, expenses, savings) and I'll give you personalized advice!

What would you like to work on today?`;
}

export async function POST(request: NextRequest) {
  try {
    if (!isSameOriginRequest(request)) {
      return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
    }

    const cookieStore = await cookies();
    const session = await readSession(cookieStore);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { message } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    const user = await convex.query(api.users.getUser, {
      userId: session.convexUserId as Id<"users">,
    });
    if (!user || user.workosId !== session.workosUserId) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const rateLimitResult = await convex.mutation(api.rateLimit.checkRateLimit, {
      identifier: session.convexUserId,
      actionType: "aiFinancialChat",
      isPremium: Boolean(user.isPremium),
    });
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded",
          message: "You've reached your financial chat limit for now. Please try again later.",
          remaining: rateLimitResult.remaining,
          resetIn: rateLimitResult.resetIn,
        },
        { status: 429 },
      );
    }

    // Extract financial data from message
    const extractedData = extractFinancialData(message);

    // Generate AI response
    const response = generateFinancialResponse(message, extractedData);

    // Clean up extracted data (remove undefined values)
    const cleanedData = Object.fromEntries(
      Object.entries(extractedData).filter(([, v]) => v !== undefined)
    );

    return NextResponse.json({
      response,
      extractedData: Object.keys(cleanedData).length > 0 ? cleanedData : undefined,
    });
  } catch (error) {
    console.error("Financial chat error:", error);
    return NextResponse.json(
      { error: "Failed to process message" },
      { status: 500 }
    );
  }
}
