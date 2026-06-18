import type { BoardingRoom, FilterOptions } from "@/types";
import roomsData from "../data/rooms.json";

const normalize = (value?: string | null) =>
  (value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\s+/g, "")
    .trim();

export function filterRooms(rooms: BoardingRoom[], filters: Partial<FilterOptions>) {
  return rooms.filter((room) => {
    const searchQuery = normalize(filters.searchQuery);
    const matchesSearch =
      !searchQuery ||
      [room.title, room.description, room.street, room.addressDetailed, room.district, room.city]
        .some((field) => normalize(field).includes(searchQuery));

    const matchesRoomType = !filters.roomType || filters.roomType === "all" || room.roomType === filters.roomType;

    const matchesPrice = (() => {
      if (!filters.priceRange || filters.priceRange === "all") return true;
      if (filters.priceRange === "under-2m") return room.price < 2000000;
      if (filters.priceRange === "2m-4m") return room.price >= 2000000 && room.price <= 4000000;
      if (filters.priceRange === "4m-7m") return room.price >= 4000000 && room.price <= 7000000;
      if (filters.priceRange === "above-7m") return room.price > 7000000;
      return true;
    })();

    const matchesArea = (() => {
      if (!filters.areaRange || filters.areaRange === "all") return true;
      if (filters.areaRange === "under-20") return room.area < 20;
      if (filters.areaRange === "20-30") return room.area >= 20 && room.area <= 30;
      if (filters.areaRange === "30-45") return room.area >= 30 && room.area <= 45;
      if (filters.areaRange === "above-45") return room.area > 45;
      return true;
    })();

    const matchesCity = !filters.city || normalize(room.city).includes(normalize(filters.city));
    const matchesDistrict = !filters.district || normalize(room.district).includes(normalize(filters.district));
    const matchesWard = !filters.ward || normalize(room.ward).includes(normalize(filters.ward));
    const matchesStreet = !filters.street || normalize(room.street).includes(normalize(filters.street));

    const matchesSharedOwner =
      !filters.isSharedOwner || filters.isSharedOwner === "all" ||
      (filters.isSharedOwner === "yes" ? room.isSharedOwner : !room.isSharedOwner);

    const matchesRating = !filters.rating || room.rating >= Number(filters.rating);

    const matchesWifi = !filters.hasWifi || filters.hasWifi === "all" || (filters.hasWifi === "yes" ? room.hasWifi : !room.hasWifi);

    const matchesWaterFee = !filters.waterFeeType || filters.waterFeeType === "all" || room.waterFeeType === filters.waterFeeType;
    const matchesStatus = !filters.status || filters.status === "all" || room.status === filters.status;
    const matchesHoursType = !filters.hoursType || filters.hoursType === "all" || room.hoursType === filters.hoursType;

    const matchesBuildYear = !filters.buildYear || filters.buildYear === "all" || String(room.buildYear) === String(filters.buildYear);

    const matchesParking = !filters.hasParking || filters.hasParking === "all" || (filters.hasParking === "yes" ? room.hasParking : !room.hasParking);
    const matchesParkingFee = !filters.parkingFeeType || filters.parkingFeeType === "all" || room.parkingFeeType === filters.parkingFeeType;
    const matchesPeopleLimit = !filters.isPeopleLimited || filters.isPeopleLimited === "all" || (filters.isPeopleLimited === "yes" ? room.isPeopleLimited : !room.isPeopleLimited);
    const matchesElevator = !filters.hasElevator || filters.hasElevator === "all" || (filters.hasElevator === "yes" ? room.hasElevator : !room.hasElevator);
    const matchesContract = !filters.hasContract || filters.hasContract === "all" || (filters.hasContract === "yes" ? room.hasContract : !room.hasContract);
    const matchesBalcony = !filters.hasBalcony || filters.hasBalcony === "all" || (filters.hasBalcony === "yes" ? room.hasBalcony : !room.hasBalcony);
    const matchesMezzanine = !filters.hasMezzanine || filters.hasMezzanine === "all" || (filters.hasMezzanine === "yes" ? room.hasMezzanine : !room.hasMezzanine);
    const matchesFurniture = !filters.hasFurniture || filters.hasFurniture === "all" || (filters.hasFurniture === "yes" ? room.hasFurniture : !room.hasFurniture);
    const matchesAirConditioner = !filters.hasAirConditioner || filters.hasAirConditioner === "all" || (filters.hasAirConditioner === "yes" ? room.hasAirConditioner : !room.hasAirConditioner);

    return (
      matchesSearch &&
      matchesRoomType &&
      matchesPrice &&
      matchesArea &&
      matchesCity &&
      matchesDistrict &&
      matchesWard &&
      matchesStreet &&
      matchesSharedOwner &&
      matchesRating &&
      matchesWifi &&
      matchesWaterFee &&
      matchesStatus &&
      matchesHoursType &&
      matchesBuildYear &&
      matchesParking &&
      matchesParkingFee &&
      matchesPeopleLimit &&
      matchesElevator &&
      matchesContract &&
      matchesBalcony &&
      matchesMezzanine &&
      matchesFurniture &&
      matchesAirConditioner
    );
  });
}

export function getDefaultRooms() {
  return (roomsData as BoardingRoom[]).slice();
}
