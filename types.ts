export interface BoardingRoom {
  id: string;
  title: string;
  description: string;
  price: number; // monthly rent in VND, e.g. 3500000
  area: number; // area in m2, e.g. 25
  city: string; // e.g. "Hồ Chí Minh"
  district: string; // e.g. "Quận 10"
  ward: string; // e.g. "Phường 12"
  street: string; // e.g. "Cách Mạng Tháng Tám"
  addressDetailed: string; // e.g. "123 Cách Mạng Tháng Tám, Phường 12, Quận 10"
  contactName: string;
  contactPhone: string;
  image: string;
  images: string[]; // Danh sách nhiều ảnh phòng trọ
  isSharedOwner: boolean; // Chung chủ (true = có, false = không)
  rating: number; // 1-5 stars
  hasWifi: boolean; // Wifi (true = có, false = không)
  waterFeeType: "miễn phí" | "có phí"; // Nước
  status: "còn phòng" | "hết phòng"; // Trạng thái
  hoursType: "tự do" | "cố định"; // Giờ giấc
  buildYear: number; // Thâm niên phòng (năm để chọn)
  hasParking: boolean; // Chỗ để xe (true = có, false = không)
  isPeopleLimited: boolean; // Giới hạn người (true = có, false = không)
  maxPeople?: number; // optionally max people
  hasElevator: boolean; // Thang máy (true = có, false = không)
  hasContract: boolean; // Hợp đồng thuê (true = có, false = không)
  hasBalcony: boolean; // Ban công (true = có, false = không)
  hasMezzanine: boolean; // Gác (true = có, false = không)
  hasFurniture: boolean; // Nội thất (true = có, false = không)
  hasAirConditioner: boolean; // Máy lạnh (true = có, false = không)
  electricityPrice: number; // Giá điện (VND/kWh)
  interestedCount: number; // Trọ được quan tâm (lượt click/view)
  ownerId?: string | null;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string | null;
  createdAt: string; // ISO date string, used for "Trọ mới đăng"
  reviews?: Review[]; // Danh sách đánh giá của phòng
}

export interface User {
  id: string;
  username: string;
  email: string;
  phone: string;
  role: "user" | "admin";
  avatar?: string;
  fullname?: string;
}

export interface Review {
  id: string;
  roomId: string;
  userId: string;
  username: string;
  rating: number; // 1-5 stars
  comment: string;
  createdAt: string;
}

export interface FilterOptions {
  searchQuery: string;
  priceRange: string; // "all" | "under-2m" | "2m-4m" | "4m-7m" | "above-7m"
  areaRange: string; // "all" | "under-20" | "20-30" | "30-45" | "above-45"
  city: string;
  district: string;
  ward: string;
  street: string;
  isSharedOwner: string; // "all" | "yes" | "no"
  rating: number | null; // null or 1-5
  hasWifi: string; // "all" | "yes" | "no"
  waterFeeType: string; // "all" | "miễn phí" | "có phí"
  status: string; // "all" | "còn phòng" | "hết phòng"
  hoursType: string; // "all" | "tự do" | "cố định"
  buildYear: string; // "all" | other string years
  hasParking: string; // "all" | "yes" | "no"
  isPeopleLimited: string; // "all" | "yes" | "no"
  hasElevator: string; // "all" | "yes" | "no"
  hasContract: string; // "all" | "yes" | "no"
  hasBalcony: string; // "all" | "yes" | "no"
  hasMezzanine: string; // "all" | "yes" | "no"
  hasFurniture: string; // "all" | "yes" | "no"
  hasAirConditioner: string; // "all" | "yes" | "no"
}

