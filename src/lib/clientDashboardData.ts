import type { Ionicons } from "@expo/vector-icons";

export type ClientBooking = {
  id: string;
  date: string;
  time: string;
  pet: string;
  service: string;
  status: "Confirmed" | "Pending";
  location: string;
  avatar: string;
};

export type ClientPet = {
  id: string;
  name: string;
  breed: string;
  age: string;
  carePlan: string;
  status: "Active" | "Needs review";
  avatar: string;
};

export type ClientActivity = {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  title: string;
  subtitle: string;
  time: string;
};

export const clientBookings: ClientBooking[] = [
  {
    id: "1",
    date: "Mon, Jul 13",
    time: "10:00 AM",
    pet: "Max",
    service: "Dog Walk",
    status: "Confirmed",
    location: "Dublin 6",
    avatar: "https://placedog.net/220/220?id=41",
  },
  {
    id: "2",
    date: "Wed, Jul 15",
    time: "2:30 PM",
    pet: "Luna",
    service: "Drop-in Visit",
    status: "Pending",
    location: "Dublin 8",
    avatar: "https://placedog.net/220/220?id=42",
  },
  {
    id: "3",
    date: "Fri, Jul 17",
    time: "9:15 AM",
    pet: "Max",
    service: "Training Session",
    status: "Confirmed",
    location: "Dublin 6W",
    avatar: "https://placedog.net/220/220?id=43",
  },
];

export const clientPets: ClientPet[] = [
  {
    id: "1",
    name: "Max",
    breed: "Golden Retriever",
    age: "3 years old",
    carePlan: "Weekly walk plan",
    status: "Active",
    avatar: "https://placedog.net/220/220?id=51",
  },
  {
    id: "2",
    name: "Luna",
    breed: "Labrador Retriever",
    age: "2 years old",
    carePlan: "Drop-in visits",
    status: "Active",
    avatar: "https://placedog.net/220/220?id=52",
  },
];

export const clientActivities: ClientActivity[] = [
  {
    id: "1",
    icon: "checkmark-circle-outline",
    color: "#16A34A",
    title: "Walk completed",
    subtitle: "Max enjoyed a 45 minute walk",
    time: "Today",
  },
  {
    id: "2",
    icon: "calendar-outline",
    color: "#5B3DF5",
    title: "Booking confirmed",
    subtitle: "Dog Walk for Mon, Jul 13",
    time: "Yesterday",
  },
  {
    id: "3",
    icon: "images-outline",
    color: "#F97316",
    title: "New photos uploaded",
    subtitle: "3 gallery updates for Luna",
    time: "Jul 9",
  },
];