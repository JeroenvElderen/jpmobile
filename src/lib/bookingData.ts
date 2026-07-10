import { Ionicons } from "@expo/vector-icons";

export type BookingStatus = "Confirmed" | "Pending" | "Cancelled";

export type BookingStat = {
  id: number;
  title: string;
  value: string;
  change: string;
  positive: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bg: string;
};

export type Booking = {
  id: string;
  createdAt: string;
  client: string;
  dog: string;
  breed: string;
  dogImage: string;
  service: "Dog Walk" | "Training Session";
  serviceIcon: keyof typeof Ionicons.glyphMap;
  serviceDetail: string;
  scheduleDay: string;
  time: string;
  duration: string;
  status: BookingStatus;
};

export const bookingStats: BookingStat[] = [
  {
    id: 1,
    title: "Total Bookings",
    value: "32",
    change: "18%",
    positive: true,
    icon: "calendar-outline",
    color: "#5B3DF5",
    bg: "#F3EEFF",
  },
  {
    id: 2,
    title: "Pending",
    value: "5",
    change: "8%",
    positive: false,
    icon: "time-outline",
    color: "#F97316",
    bg: "#FFF5EB",
  },
  {
    id: 3,
    title: "Confirmed",
    value: "23",
    change: "22%",
    positive: true,
    icon: "checkmark-circle-outline",
    color: "#16A34A",
    bg: "#ECFDF3",
  },
  {
    id: 4,
    title: "Cancelled",
    value: "4",
    change: "13%",
    positive: false,
    icon: "close-circle-outline",
    color: "#E11D48",
    bg: "#FFEAF0",
  },
];

export const bookings: Booking[] = [
  {
    id: "#BKG-00032",
    createdAt: "May 25, 2024",
    client: "Sarah Johnson",
    dog: "Max",
    breed: "Golden Retriever",
    dogImage: "https://images.unsplash.com/photo-1552053831-71594a27632d?w=160&h=160&fit=crop&crop=faces",
    service: "Dog Walk",
    serviceIcon: "accessibility-outline",
    serviceDetail: "Solo Walk",
    scheduleDay: "Today, May 25",
    time: "10:00 AM",
    duration: "60 min",
    status: "Confirmed",
  },
  {
    id: "#BKG-00031",
    createdAt: "May 24, 2024",
    client: "James Smith",
    dog: "Luna",
    breed: "Labrador",
    dogImage: "https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?w=160&h=160&fit=crop&crop=faces",
    service: "Training Session",
    serviceIcon: "school-outline",
    serviceDetail: "Basic Obedience",
    scheduleDay: "Today, May 25",
    time: "1:00 PM",
    duration: "60 min",
    status: "Confirmed",
  },
  {
    id: "#BKG-00030",
    createdAt: "May 24, 2024",
    client: "Emily Davis",
    dog: "Buddy",
    breed: "Beagle",
    dogImage: "https://images.unsplash.com/photo-1505628346881-b72b27e84530?w=160&h=160&fit=crop&crop=faces",
    service: "Dog Walk",
    serviceIcon: "accessibility-outline",
    serviceDetail: "Solo Walk",
    scheduleDay: "Tomorrow, May 26",
    time: "9:00 AM",
    duration: "30 min",
    status: "Pending",
  },
  {
    id: "#BKG-00029",
    createdAt: "May 23, 2024",
    client: "Michael Brown",
    dog: "Charlie",
    breed: "Goldendoodle",
    dogImage: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=160&h=160&fit=crop&crop=faces",
    service: "Training Session",
    serviceIcon: "school-outline",
    serviceDetail: "Puppy Training",
    scheduleDay: "Tomorrow, May 26",
    time: "11:30 AM",
    duration: "60 min",
    status: "Confirmed",
  },
  {
    id: "#BKG-00028",
    createdAt: "May 22, 2024",
    client: "Olivia Wilson",
    dog: "Milo",
    breed: "Husky",
    dogImage: "https://images.unsplash.com/photo-1605568427561-40dd23c2acea?w=160&h=160&fit=crop&crop=faces",
    service: "Dog Walk",
    serviceIcon: "accessibility-outline",
    serviceDetail: "Group Walk",
    scheduleDay: "May 27, 2024",
    time: "4:00 PM",
    duration: "60 min",
    status: "Confirmed",
  },
  {
    id: "#BKG-00027",
    createdAt: "May 22, 2024",
    client: "Daniel Taylor",
    dog: "Poppy",
    breed: "Pug",
    dogImage: "https://images.unsplash.com/photo-1517849845537-4d257902454a?w=160&h=160&fit=crop&crop=faces",
    service: "Dog Walk",
    serviceIcon: "accessibility-outline",
    serviceDetail: "Solo Walk",
    scheduleDay: "May 27, 2024",
    time: "10:00 AM",
    duration: "30 min",
    status: "Cancelled",
  },
  {
    id: "#BKG-00026",
    createdAt: "May 21, 2024",
    client: "Sophia Anderson",
    dog: "Bella",
    breed: "Cavalier King Charles",
    dogImage: "https://images.unsplash.com/photo-1588943211346-0908a1fb0b01?w=160&h=160&fit=crop&crop=faces",
    service: "Dog Walk",
    serviceIcon: "accessibility-outline",
    serviceDetail: "Solo Walk",
    scheduleDay: "May 28, 2024",
    time: "2:00 PM",
    duration: "60 min",
    status: "Pending",
  },
];