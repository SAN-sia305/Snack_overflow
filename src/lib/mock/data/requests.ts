import { SnackProductRequest } from "@/types";

const NOW = new Date("2026-11-13T14:00:00Z");
const daysAgo = (days: number) =>
  new Date(NOW.getTime() - days * 24 * 60 * 60 * 1000).toISOString();

export const SEED_REQUESTS: SnackProductRequest[] = [
  {
    id: "req_group_1",
    normalizedProductKey: "kaju katli",
    productName: "Kaju Katli (Cashew Fudge)",
    status: "requested",
    distinctRequesterCount: 6,
    createdAt: daysAgo(6),
    updatedAt: daysAgo(1),
    requests: [
      {
        id: "mem_req_1",
        productRequestId: "req_group_1",
        userId: "usr_member_1", // Priya Sharma
        userName: "Priya Sharma",
        expectedPriceInr: 120,
        note: "Would love this for celebration days or sprint closures!",
        createdAt: daysAgo(6),
      },
      {
        id: "mem_req_2",
        productRequestId: "req_group_1",
        userId: "usr_member_2", // Karthik Raja
        userName: "Karthik Raja",
        expectedPriceInr: 150,
        note: "Traditional sweet craving during late bug bashes.",
        createdAt: daysAgo(5),
      },
      {
        id: "mem_req_3",
        productRequestId: "req_group_1",
        userId: "usr_member_3", // Ananya Iyer
        userName: "Ananya Iyer",
        expectedPriceInr: 130,
        createdAt: daysAgo(4),
      },
      {
        id: "mem_req_4",
        productRequestId: "req_group_1",
        userId: "usr_member_5", // Sneha Nair
        userName: "Sneha Nair",
        expectedPriceInr: 140,
        note: "Pure cashew sweets give an amazing afternoon energy lift.",
        createdAt: daysAgo(3),
      },
      {
        id: "mem_req_5",
        productRequestId: "req_group_1",
        userId: "usr_member_6", // Rahul Verma
        userName: "Rahul Verma",
        expectedPriceInr: 125,
        createdAt: daysAgo(2),
      },
      {
        id: "mem_req_6",
        productRequestId: "req_group_1",
        userId: "usr_member_8", // Rohan Joshi
        userName: "Rohan Joshi",
        expectedPriceInr: 130,
        note: "Great companion for team tea sessions.",
        createdAt: daysAgo(1),
      },
    ],
  },
  {
    id: "req_group_2",
    normalizedProductKey: "cold brew iced latte",
    productName: "Cold Brew Iced Latte (Sugar Free)",
    status: "approved",
    distinctRequesterCount: 4,
    createdAt: daysAgo(10),
    updatedAt: daysAgo(3),
    reviewedBy: "usr_admin_1",
    reviewedAt: daysAgo(3),
    decisionNote: "Approved for pantry trial; looking for local cold brew vendor.",
    requests: [
      {
        id: "mem_req_7",
        productRequestId: "req_group_2",
        userId: "usr_member_1", // Priya Sharma
        userName: "Priya Sharma",
        expectedPriceInr: 60,
        note: "Refreshing pick-me-up for Coimbatore summers.",
        createdAt: daysAgo(10),
      },
      {
        id: "mem_req_8",
        productRequestId: "req_group_2",
        userId: "usr_member_4", // Vikram Sethi
        userName: "Vikram Sethi",
        expectedPriceInr: 75,
        createdAt: daysAgo(8),
      },
      {
        id: "mem_req_9",
        productRequestId: "req_group_2",
        userId: "usr_member_7", // Divya Menon
        userName: "Divya Menon",
        expectedPriceInr: 65,
        note: "Needs to be sugar-free or oat milk if possible.",
        createdAt: daysAgo(6),
      },
      {
        id: "mem_req_10",
        productRequestId: "req_group_2",
        userId: "usr_member_2", // Karthik Raja
        userName: "Karthik Raja",
        expectedPriceInr: 70,
        createdAt: daysAgo(5),
      },
    ],
  },
  {
    id: "req_group_3",
    normalizedProductKey: "roasted pistachios",
    productName: "California Roasted Pistachios",
    status: "purchased",
    distinctRequesterCount: 3,
    createdAt: daysAgo(12),
    updatedAt: daysAgo(2),
    reviewedBy: "usr_admin_1",
    reviewedAt: daysAgo(4),
    purchasedAt: daysAgo(2),
    decisionNote: "Ordered 25 packets from wholesale pantry distributor.",
    requests: [
      {
        id: "mem_req_11",
        productRequestId: "req_group_3",
        userId: "usr_member_3", // Ananya Iyer
        userName: "Ananya Iyer",
        expectedPriceInr: 140,
        note: "Lightly salted with shell.",
        createdAt: daysAgo(12),
      },
      {
        id: "mem_req_12",
        productRequestId: "req_group_3",
        userId: "usr_member_5", // Sneha Nair
        userName: "Sneha Nair",
        expectedPriceInr: 150,
        createdAt: daysAgo(9),
      },
      {
        id: "mem_req_13",
        productRequestId: "req_group_3",
        userId: "usr_member_6", // Rahul Verma
        userName: "Rahul Verma",
        expectedPriceInr: 130,
        note: "Healthy afternoon snack.",
        createdAt: daysAgo(8),
      },
    ],
  },
  {
    id: "req_group_4",
    normalizedProductKey: "kerala banana chips",
    productName: "Kerala Banana Chips (Coconut Oil)",
    status: "available",
    distinctRequesterCount: 5,
    createdAt: daysAgo(20),
    updatedAt: daysAgo(5),
    reviewedBy: "usr_admin_1",
    reviewedAt: daysAgo(14),
    purchasedAt: daysAgo(8),
    availableAt: daysAgo(5),
    linkedSnackId: "snack_2",
    actualQuantityAdded: 20,
    requests: [
      {
        id: "mem_req_14",
        productRequestId: "req_group_4",
        userId: "usr_member_1", // Priya Sharma
        userName: "Priya Sharma",
        expectedPriceInr: 40,
        note: "Authentic Nendran chips please!",
        createdAt: daysAgo(20),
      },
      {
        id: "mem_req_15",
        productRequestId: "req_group_4",
        userId: "usr_member_2", // Karthik Raja
        userName: "Karthik Raja",
        expectedPriceInr: 45,
        createdAt: daysAgo(18),
      },
      {
        id: "mem_req_16",
        productRequestId: "req_group_4",
        userId: "usr_member_4", // Vikram Sethi
        userName: "Vikram Sethi",
        expectedPriceInr: 50,
        createdAt: daysAgo(17),
      },
      {
        id: "mem_req_17",
        productRequestId: "req_group_4",
        userId: "usr_member_7", // Divya Menon
        userName: "Divya Menon",
        expectedPriceInr: 45,
        createdAt: daysAgo(16),
      },
      {
        id: "mem_req_18",
        productRequestId: "req_group_4",
        userId: "usr_member_8", // Rohan Joshi
        userName: "Rohan Joshi",
        expectedPriceInr: 40,
        createdAt: daysAgo(15),
      },
    ],
  },
  {
    id: "req_group_5",
    normalizedProductKey: "ultra sour candy strips",
    productName: "Ultra Sour Rainbow Candy Strips",
    status: "rejected",
    distinctRequesterCount: 1,
    createdAt: daysAgo(14),
    updatedAt: daysAgo(11),
    reviewedBy: "usr_admin_1",
    reviewedAt: daysAgo(11),
    decisionNote: "High sugar and artificial color content; does not align with pantry health policy.",
    requests: [
      {
        id: "mem_req_19",
        productRequestId: "req_group_5",
        userId: "usr_member_6", // Rahul Verma
        userName: "Rahul Verma",
        expectedPriceInr: 30,
        note: "Fun sour candy for quick desk amusement.",
        createdAt: daysAgo(14),
      },
    ],
  },
];

