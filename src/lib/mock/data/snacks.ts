import { Snack } from "@/types";

// Current mock date benchmark
const NOW = new Date("2026-11-13T14:00:00Z");

const daysAgo = (days: number) => {
  const d = new Date(NOW.getTime() - days * 24 * 60 * 60 * 1000);
  return d.toISOString();
};

const daysAhead = (days: number) => {
  const d = new Date(NOW.getTime() + days * 24 * 60 * 60 * 1000);
  return d.toISOString();
};

export const SEED_SNACKS: Snack[] = [
  {
    id: "snack_1",
    name: "South Indian Filter Coffee Brew",
    category: "drink",
    description:
      "Traditional chicory-infused decoction with steamed milk. Strong, aromatic, and office energy fuel.",
    imageUrl:
      "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80",
    quantity: 18,
    lowStockThreshold: 5,
    voteCount: 19,
    createdAt: daysAgo(30),
    updatedAt: daysAgo(1),
    priceInr: 30,
  },
  {
    id: "snack_2",
    name: "Kerala Banana Chips (Coconut Oil)",
    category: "savoury",
    description:
      "Thinly sliced raw Nendran plantains fried crisp in pure coconut oil with sea salt and turmeric.",
    imageUrl:
      "https://images.unsplash.com/photo-1621996346565-e3d5d6281e81?w=600&auto=format&fit=crop&q=80",
    quantity: 12,
    lowStockThreshold: 5,
    voteCount: 15,
    createdAt: daysAgo(5),
    updatedAt: daysAgo(1),
    arrivalUntil: daysAhead(2), // Active New Arrival
    priceInr: 45,
  },
  {
    id: "snack_3",
    name: "70% Dark Chocolate Almond Bites",
    category: "sweet",
    description:
      "Single-origin Indian cacao nibs coating whole slow-roasted California almonds. Rich and satisfying.",
    imageUrl:
      "https://images.unsplash.com/photo-1548907040-4baa42d10919?w=600&auto=format&fit=crop&q=80",
    quantity: 3,
    lowStockThreshold: 5, // Running Low!
    voteCount: 17,
    createdAt: daysAgo(20),
    updatedAt: daysAgo(2),
    priceInr: 80,
  },
  {
    id: "snack_4",
    name: "Spiced Masala Potato Chips",
    category: "savoury",
    description:
      "Hand-cooked kettle chips tossed in red chilli, amchur (dry mango powder), and toasted cumin.",
    imageUrl:
      "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=600&auto=format&fit=crop&q=80",
    quantity: 24,
    lowStockThreshold: 6,
    voteCount: 12,
    createdAt: daysAgo(45),
    updatedAt: daysAgo(3),
    priceInr: 25,
  },
  {
    id: "snack_5",
    name: "Slow-Roasted Salted Almonds",
    category: "healthy-ish",
    description:
      "Nutrient-dense whole almonds dry-roasted with pink Himalayan rock salt. Heart-healthy protein fix.",
    imageUrl:
      "https://images.unsplash.com/photo-1508061252227-0c337e152285?w=600&auto=format&fit=crop&q=80",
    quantity: 0, // Gone!
    lowStockThreshold: 5,
    voteCount: 8,
    createdAt: daysAgo(60),
    updatedAt: daysAgo(1),
    priceInr: 120,
  },
  {
    id: "snack_6",
    name: "Peri-Peri Roasted Fox Nuts (Makhana)",
    category: "healthy-ish",
    description:
      "Light, airy lotus seeds roasted in olive oil with fiery African bird's eye chilli seasoning.",
    imageUrl:
      "https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=600&auto=format&fit=crop&q=80",
    quantity: 14,
    lowStockThreshold: 4,
    voteCount: 11,
    createdAt: daysAgo(4),
    updatedAt: daysAgo(1),
    arrivalUntil: daysAhead(3), // Active New Arrival
    priceInr: 60,
  },
  {
    id: "snack_7",
    name: "Coimbatore Tender Coconut Water",
    category: "drink",
    description:
      "Naturally sweet, potassium-rich fresh tender coconut water. Chilled, no preservatives.",
    imageUrl:
      "https://images.unsplash.com/photo-1525385133512-2f3bdd039054?w=600&auto=format&fit=crop&q=80",
    quantity: 2,
    lowStockThreshold: 6, // Running Low!
    voteCount: 16,
    createdAt: daysAgo(12),
    updatedAt: daysAgo(1),
    priceInr: 40,
  },
  {
    id: "snack_8",
    name: "Ragi & Oat Multigrain Cookies",
    category: "healthy-ish",
    description:
      "Crispy fiber-rich biscuits baked with finger millet, rolled oats, and organic jaggery.",
    imageUrl:
      "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=600&auto=format&fit=crop&q=80",
    quantity: 9,
    lowStockThreshold: 5,
    voteCount: 6,
    createdAt: daysAgo(15),
    updatedAt: daysAgo(4),
    priceInr: 50,
  },
  {
    id: "snack_9",
    name: "Mysore Pak (Ghee Soft Cube)",
    category: "sweet",
    description:
      "Mouth-melting traditional South Indian sweet made with roasted gram flour, pure cow ghee, and sugar.",
    imageUrl:
      "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=600&auto=format&fit=crop&q=80",
    quantity: 1,
    lowStockThreshold: 4, // Running Low!
    voteCount: 14,
    createdAt: daysAgo(8),
    updatedAt: daysAgo(2),
    priceInr: 70,
  },
  {
    id: "snack_10",
    name: "Cold-Pressed Alphonso Mango Juice",
    category: "drink",
    description:
      "Rich Ratnagiri Alphonso mango pulp lightly sweetened with raw cane sugar. No artificial coloring.",
    imageUrl:
      "https://images.unsplash.com/photo-1546173159-315724a31696?w=600&auto=format&fit=crop&q=80",
    quantity: 16,
    lowStockThreshold: 5,
    voteCount: 9,
    createdAt: daysAgo(22),
    updatedAt: daysAgo(3),
    priceInr: 55,
  },
  {
    id: "snack_11",
    name: "Crunchy Masala Peanuts",
    category: "savoury",
    description:
      "Crisp gram-flour coated roasted peanuts spiked with carom seeds (ajwain), curry leaves, and chilli.",
    imageUrl:
      "https://images.unsplash.com/photo-1569466593574-dcf176219460?w=600&auto=format&fit=crop&q=80",
    quantity: 0, // Gone!
    lowStockThreshold: 5,
    voteCount: 4,
    createdAt: daysAgo(40),
    updatedAt: daysAgo(1),
    priceInr: 20,
  },
  {
    id: "snack_12",
    name: "Chewy Granola Trail Mix",
    category: "healthy-ish",
    description:
      "Power mix of pumpkin seeds, dried cranberries, California raisins, chia seeds, and walnut halves.",
    imageUrl:
      "https://images.unsplash.com/photo-1514733670139-4d87a1941d55?w=600&auto=format&fit=crop&q=80",
    quantity: 11,
    lowStockThreshold: 4,
    voteCount: 5,
    createdAt: daysAgo(18),
    updatedAt: daysAgo(5),
    priceInr: 95,
  },
  {
    id: "snack_13",
    name: "Sparkling Mint & Lemon Soda",
    category: "drink",
    description:
      "Refreshing bubbly thirst-quencher with real Key lime juice, crushed garden mint, and black salt.",
    imageUrl:
      "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&auto=format&fit=crop&q=80",
    quantity: 20,
    lowStockThreshold: 6,
    voteCount: 7,
    createdAt: daysAgo(3),
    updatedAt: daysAgo(1),
    arrivalUntil: daysAhead(4), // Active New Arrival
    priceInr: 35,
  },
  {
    id: "snack_14",
    name: "Dark Chocolate Peanut Butter Cups",
    category: "sweet",
    description:
      "Creamy, lightly salted roasted peanut butter center encased in 65% dark Belgian chocolate shell.",
    imageUrl:
      "https://images.unsplash.com/photo-1526081347589-7fa3cb41b4b2?w=600&auto=format&fit=crop&q=80",
    quantity: 7,
    lowStockThreshold: 4,
    voteCount: 13,
    createdAt: daysAgo(25),
    updatedAt: daysAgo(2),
    priceInr: 65,
  },
  {
    id: "snack_15",
    name: "Murukku Wheels (Chakli)",
    category: "savoury",
    description:
      "Spiralled crunchy rice flour and urad dal savory snacks seasoned with sesame and asafoetida.",
    imageUrl:
      "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80",
    quantity: 0, // Gone!
    lowStockThreshold: 5,
    voteCount: 0, // Zero votes example
    createdAt: daysAgo(50),
    updatedAt: daysAgo(4),
    priceInr: 30,
  },
  {
    id: "snack_16",
    name: "Organic Dried Medjool Dates",
    category: "healthy-ish",
    description:
      "Caramel-sweet, plump pitted Medjool dates. Pure natural sweetness with high potassium.",
    imageUrl:
      "https://images.unsplash.com/photo-1549488344-1f9b8d2bd1f3?w=600&auto=format&fit=crop&q=80",
    quantity: 8,
    lowStockThreshold: 4,
    voteCount: 3,
    createdAt: daysAgo(10),
    updatedAt: daysAgo(1),
    priceInr: 110,
  },
];

