import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, TextInput, View } from "react-native";

export default function ClientFilters({ searchQuery, onSearchChange }: { searchQuery: string; onSearchChange: (value: string) => void }) {
  return (
    <View style={styles.container}>
      <View style={styles.search}>
        <Ionicons name="search-outline" size={22} color="#65708F" />
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="while-editing"
          onChangeText={onSearchChange}
          placeholder="Search by client name, dog, or email..."
          placeholderTextColor="#737B9A"
          returnKeyType="search"
          style={styles.searchInput}
          value={searchQuery}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 10,
  },
  search: {
    alignItems: "center",
    backgroundColor: "#FFF",
    borderColor: "#ECECF5",
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    height: 54,
    marginBottom: 14,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.03,
    shadowRadius: 14,
  },
  searchInput: {
    color: "#11162B",
    flex: 1,
    fontSize: 15,
    marginLeft: 10,
  },
});