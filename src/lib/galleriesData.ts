import type { Ionicons } from "@expo/vector-icons";

export type GalleryStatus = "Published" | "Private";

export type GalleryStat = {
  title: string;
  value: string;
  change: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBackground: string;
};

export type Gallery = {
  id: string;
  title: string;
  client: string;
  dog: string;
  date: string;
  time: string;
  photoCount: number;
  status: GalleryStatus;
  cover: string;
};

export const galleryStats: GalleryStat[] = [
  {
    title: "Total Galleries",
    value: "27",
    change: "12%",
    icon: "images-outline",
    iconColor: "#5B3DF5",
    iconBackground: "#F3EEFF",
  },
  {
    title: "Total Photos",
    value: "342",
    change: "18%",
    icon: "eye-outline",
    iconColor: "#F97316",
    iconBackground: "#FFF5EB",
  },
  {
    title: "Downloads",
    value: "128",
    change: "15%",
    icon: "download-outline",
    iconColor: "#16A34A",
    iconBackground: "#ECFDF3",
  },
  {
    title: "Favorites",
    value: "56",
    change: "10%",
    icon: "heart-outline",
    iconColor: "#EF476F",
    iconBackground: "#FDECF1",
  },
];

export const galleries: Gallery[] = [
  {
    id: "1",
    title: "Max's Adventure Walk",
    client: "Sarah Johnson",
    dog: "Max (Golden Retriever)",
    date: "May 25, 2024",
    time: "10:00 AM",
    photoCount: 24,
    status: "Published",
    cover: "https://placedog.net/320/220?id=21",
  },
  {
    id: "2",
    title: "Luna's Training Session",
    client: "James Smith",
    dog: "Luna (Labrador)",
    date: "May 24, 2024",
    time: "1:00 PM",
    photoCount: 18,
    status: "Published",
    cover: "https://placedog.net/320/220?id=22",
  },
  {
    id: "3",
    title: "Buddy's Park Playdate",
    client: "Emily Davis",
    dog: "Buddy (Beagle)",
    date: "May 23, 2024",
    time: "4:00 PM",
    photoCount: 15,
    status: "Private",
    cover: "https://placedog.net/320/220?id=23",
  },
  {
    id: "4",
    title: "Charlie's Day Out",
    client: "Michael Brown",
    dog: "Charlie (Goldendoodle)",
    date: "May 22, 2024",
    time: "11:30 AM",
    photoCount: 32,
    status: "Published",
    cover: "https://placedog.net/320/220?id=24",
  },
];
