import type { Ionicons } from "@expo/vector-icons";

export type DogStatus = "Active" | "Inactive";

export type Dog = {
  id: string;
  name: string;
  breed: string;
  owner: string;
  bookings: number;
  age: string;
  status: DogStatus;
  avatar: string;
};

export type DogStat = {
  title: string;
  value: string;
  change: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBackground: string;
};

export const dogStats: DogStat[] = [
  {
    title: "Total Dogs",
    value: "48",
    change: "12%",
    icon: "paw-outline",
    iconColor: "#5B3DF5",
    iconBackground: "#F3EEFF",
  },
  {
    title: "Active",
    value: "41",
    change: "8%",
    icon: "heart-outline",
    iconColor: "#F97316",
    iconBackground: "#FFF5EB",
  },
  {
    title: "Regulars",
    value: "28",
    change: "15%",
    icon: "shield-checkmark-outline",
    iconColor: "#16A34A",
    iconBackground: "#ECFDF3",
  },
  {
    title: "New This Month",
    value: "7",
    change: "5%",
    icon: "star-outline",
    iconColor: "#EF476F",
    iconBackground: "#FDECF1",
  },
];

export const dogs: Dog[] = [
  {
    id: "1",
    name: "Max",
    breed: "Golden Retriever",
    owner: "Sarah Johnson",
    bookings: 12,
    age: "3 years old",
    status: "Active",
    avatar: "https://placedog.net/220/220?id=11",
  },
  {
    id: "2",
    name: "Luna",
    breed: "Labrador Retriever",
    owner: "James Smith",
    bookings: 8,
    age: "2 years old",
    status: "Active",
    avatar: "https://placedog.net/220/220?id=12",
  },
  {
    id: "3",
    name: "Buddy",
    breed: "Beagle",
    owner: "Emily Davis",
    bookings: 15,
    age: "4 years old",
    status: "Active",
    avatar: "https://placedog.net/220/220?id=13",
  },
  {
    id: "4",
    name: "Charlie",
    breed: "Goldendoodle",
    owner: "Michael Brown",
    bookings: 10,
    age: "1 year old",
    status: "Active",
    avatar: "https://placedog.net/220/220?id=14",
  },
  {
    id: "5",
    name: "Milo",
    breed: "Husky",
    owner: "Olivia Wilson",
    bookings: 6,
    age: "2 years old",
    status: "Active",
    avatar: "https://placedog.net/220/220?id=15",
  },
  {
    id: "6",
    name: "Poppy",
    breed: "Pug",
    owner: "Daniel Taylor",
    bookings: 0,
    age: "5 years old",
    status: "Inactive",
    avatar: "https://placedog.net/220/220?id=16",
  },
  {
    id: "7",
    name: "Bella",
    breed: "Cavalier King Charles",
    owner: "Sophia Anderson",
    bookings: 9,
    age: "3 years old",
    status: "Active",
    avatar: "https://placedog.net/220/220?id=17",
  },
];