import axios from "axios";

export const SUPPORTED_CURRENCIES = [
  { code: "INR", name: "Indian Rupee", symbol: "₹" },
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "GBP", name: "British Pound", symbol: "£" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥" },
  { code: "CAD", name: "Canadian Dollar", symbol: "C$" },
  { code: "AUD", name: "Australian Dollar", symbol: "A$" },
  { code: "SGD", name: "Singapore Dollar", symbol: "S$" },
  { code: "AED", name: "UAE Dirham", symbol: "د.إ" },
  { code: "SAR", name: "Saudi Riyal", symbol: "﷼" },
  { code: "CHF", name: "Swiss Franc", symbol: "Fr" },
  { code: "CNY", name: "Chinese Yuan", symbol: "¥" },
  { code: "NZD", name: "New Zealand Dollar", symbol: "NZ$" },
  { code: "MYR", name: "Malaysian Ringgit", symbol: "RM" },
];

export interface ConversionResult {
  convertedAmount: number;
  rate: number;
  originalNotes: string;
}

/**
 * Converts a given amount from a source currency to INR using live exchange rates.
 */
export async function convertToINR(
  amount: number,
  sourceCurrency: string,
  existingNotes: string = ""
): Promise<ConversionResult> {
  if (sourceCurrency === "INR") {
    return {
      convertedAmount: amount,
      rate: 1,
      originalNotes: existingNotes,
    };
  }

  try {
    const res = await axios.get(`https://api.exchangerate-api.com/v4/latest/${sourceCurrency}`);
    const rateToINR = res.data.rates["INR"];

    if (!rateToINR) {
      throw new Error(`Exchange rate for ${sourceCurrency} to INR not found.`);
    }

    const convertedAmount = Math.round(amount * rateToINR);
    const originalNotes = `(Original: ${amount} ${sourceCurrency}) ${existingNotes}`.trim();

    return {
      convertedAmount,
      rate: rateToINR,
      originalNotes,
    };
  } catch (error) {
    console.error("Currency conversion error:", error);
    throw new Error("Failed to fetch exchange rate. Please try again.");
  }
}
