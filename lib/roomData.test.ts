import test from "node:test";
import assert from "node:assert/strict";
import { filterRooms } from "./roomData";
import roomsData from "../data/rooms.json" assert { type: "json" };

test("filters rooms by city and price range", () => {
  const result = filterRooms(roomsData as any[], {
    city: "Hồ Chí Minh",
    priceRange: "4m-7m",
  });

  assert.equal(result.length, 2);
  assert.deepEqual(result.map((room) => room.id).sort(), ["room-1", "room-3"]);
});
