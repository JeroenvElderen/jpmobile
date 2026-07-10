import type { Ionicons } from "@expo/vector-icons";

export type ClientStatus = "Active" | "Inactive";

export type Client = {
  id: string;
  name: string;
  email: string;
  dogs: string;
  bookings: number;
  memberSince: string;
  status: ClientStatus;
  avatar: string;
};

export type ClientStat = {
  title: string;
  value: string;
  change: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBackground: string;
};

export const clientStats: ClientStat[] = [
  {
    title: "Total Clients",
    value: "42",
    change: "12%",
    icon: "people-outline",
    iconColor: "#5B3DF5",
    iconBackground: "#F3EEFF",
  },
  {
    title: "Active",
    value: "36",
    change: "8%",
    icon: "heart-outline",
    iconColor: "#F97316",
    iconBackground: "#FFF5EB",
  },
  {
    title: "Regulars",
    value: "24",
    change: "15%",
    icon: "shield-checkmark-outline",
    iconColor: "#16A34A",
    iconBackground: "#ECFDF3",
  },
  {
    title: "New This Month",
    value: "6",
    change: "5%",
    icon: "star-outline",
    iconColor: "#EF476F",
    iconBackground: "#FDECF1",
  },
];

export const clients: Client[] = [
  {
    id: "1",
    name: "Sarah Johnson",
    email: "sarah.johnson@example.com",
    dogs: "Max • Golden Retriever",
    bookings: 12,
    memberSince: "Member since 2023",
    status: "Active",
    avatar: "https://i.pravatar.cc/220?img=47",
  },
  {
    id: "2",
    name: "James Smith",
    email: "james.smith@example.com",
    dogs: "Luna • Labrador Retriever",
    bookings: 8,
    memberSince: "Member since 2024",
    status: "Active",
    avatar: "https://i.pravatar.cc/220?img=12",
  },
  {
    id: "3",
    name: "Emily Davis",
    email: "emily.davis@example.com",
    dogs: "Buddy • Beagle",
    bookings: 15,
    memberSince: "Member since 2022",
    status: "Active",
    avatar: "https://i.pravatar.cc/220?img=32",
  },
  {
    id: "4",
    name: "Michael Brown",
    email: "michael.brown@example.com",
    dogs: "Charlie • Goldendoodle",
    bookings: 10,
    memberSince: "Member since 2023",
    status: "Active",
    avatar: "https://i.pravatar.cc/220?img=15",
  },
  {
    id: "5",
    name: "Olivia Wilson",
    email: "olivia.wilson@example.com",
    dogs: "Milo • Husky",
    bookings: 6,
    memberSince: "Member since 2024",
    status: "Active",
    avatar: "https://i.pravatar.cc/220?img=44",
  },
  {
    id: "6",
    name: "Daniel Taylor",
    email: "daniel.taylor@example.com",
    dogs: "Poppy • Pug",
    bookings: 0,
    memberSince: "Member since 2021",
    status: "Inactive",
    avatar: "https://i.pravatar.cc/220?img=14",
  },
  {
    id: "7",
    name: "Sophia Anderson",
    email: "sophia.anderson@example.com",
    dogs: "Bella • Cavalier King Charles",
    bookings: 9,
    memberSince: "Member since 2023",
    status: "Active",
    avatar: "https://i.pravatar.cc/220?img=48",
  },
];