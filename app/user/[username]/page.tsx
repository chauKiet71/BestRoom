"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Building2,
  CalendarDays,
  Camera,
  Check,
  ChevronDown,
  Eye,
  Heart,
  Image as ImageIcon,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
  Save,
  Settings,
  Star,
  Trophy,
  UserRound,
  Users,
  Trash2,
  X,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { BoardingRoom, ROOM_TYPE_OPTIONS, User } from "@/types";
import { formatVND } from "@/components/RoomCard";
import { roomService } from "@/services/roomService";
import { userService } from "@/services/userService";
import { roomDetailPath } from "@/lib/routes";
import PageLoader from "@/components/PageLoader";

const createDefaultListingForm = (user: User | null): Partial<BoardingRoom> => ({
  title: "",
  roomType: "Phòng trọ",
  description: "",
  price: 2500000,
  area: 22,
  city: "Hồ Chí Minh",
  district: "Quận Bình Thạnh",
  ward: "Phường 15",
  street: "Điện Biên Phủ",
  addressDetailed: "280 Điện Biên Phủ, Phường 15, Quận Bình Thạnh, TP. HCM",
  contactName: user?.fullname || user?.username || "",
  contactPhone: user?.phone || "",
  image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=900&q=80",
  images: [],
  isSharedOwner: false,
  rating: 0,
  hasWifi: true,
  waterFeeType: "có phí",
  status: "còn phòng",
  hoursType: "tự do",
  buildYear: new Date().getFullYear(),
  hasParking: true,
  parkingFeeType: "miễn phí",
  isPeopleLimited: false,
  maxPeople: 2,
  hasElevator: false,
  hasContract: true,
  hasBalcony: false,
  hasMezzanine: false,
  hasFurniture: true,
  hasAirConditioner: true,
  electricityPrice: 3500,
});

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentUser, setCurrentUser, setRooms: setGlobalRooms } = useApp();
  const usernameParam = params.username as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [rooms, setRooms] = useState<BoardingRoom[]>([]);
  const [scheduleCount, setScheduleCount] = useState(0);
  const [copied, setCopied] = useState(false);
  const [isPhoneVisible, setIsPhoneVisible] = useState(false);
  const [activeTab, setActiveTab] = useState("about");
  const [isEditing, setIsEditing] = useState(false);
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editAvatar, setEditAvatar] = useState("");
  const [editFullname, setEditFullname] = useState("");
  const [editExperienceYears, setEditExperienceYears] = useState("3 năm");
  const [editWorkingHours, setEditWorkingHours] = useState("8:00 - 21:00 (T2 - CN)");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarUploadError, setAvatarUploadError] = useState<string | null>(null);
  const [editPanel, setEditPanel] = useState<"profile" | "listing" | "posted">("profile");
  const [listingForm, setListingForm] = useState<Partial<BoardingRoom>>(() => createDefaultListingForm(null));
  const [isCreatingListing, setIsCreatingListing] = useState(false);
  const [createListingError, setCreateListingError] = useState<string | null>(null);
  const [editingRoom, setEditingRoom] = useState<BoardingRoom | null>(null);
  const [isUpdatingListing, setIsUpdatingListing] = useState(false);
  const [updateListingError, setUpdateListingError] = useState<string | null>(null);
  const [deleteTargetRoom, setDeleteTargetRoom] = useState<BoardingRoom | null>(null);
  const [isDeletingListing, setIsDeletingListing] = useState(false);
  const [deleteListingError, setDeleteListingError] = useState<string | null>(null);
  const [isUploadingListingMainImage, setIsUploadingListingMainImage] = useState(false);
  const [listingMainImageError, setListingMainImageError] = useState<string | null>(null);
  const [isUploadingListingImages, setIsUploadingListingImages] = useState(false);
  const [listingImagesError, setListingImagesError] = useState<string | null>(null);

  useEffect(() => {
    if (!usernameParam) return;

    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`/api/users/profile/${encodeURIComponent(usernameParam)}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Không thể tải thông tin cá nhân.");
        }

        setProfileUser(data.user);
        setRooms(Array.isArray(data.rooms) ? data.rooms : []);
        setScheduleCount(Number(data.scheduleCount || 0));
      } catch (err: any) {
        setError(err.message || "Đã xảy ra lỗi.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [usernameParam]);

  useEffect(() => {
    if (!profileUser) return;
    setEditEmail(profileUser.email);
    setEditPhone(profileUser.phone);
    setEditAvatar(profileUser.avatar || "");
    setEditFullname(profileUser.fullname || "");
    setEditExperienceYears(profileUser.experienceYears || "3 năm");
    setEditWorkingHours(profileUser.workingHours || "8:00 - 21:00 (T2 - CN)");
  }, [profileUser]);

  const isEditPage = searchParams.has("edit");

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "rooms" || tab === "about") {
      setActiveTab(tab);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!isEditPage || searchParams.get("tab") !== "listing" || !currentUser) return;
    if (currentUser.role === "admin" || (currentUser.freePostsRemaining || 0) > 0 || (currentUser.activePlan?.remainingPosts || 0) > 0) {
      setEditPanel("listing");
    }
  }, [currentUser, isEditPage, searchParams]);

  useEffect(() => {
    if (!currentUser) return;
    setListingForm((prev) => ({
      ...createDefaultListingForm(currentUser),
      ...prev,
      contactName: prev.contactName || currentUser.fullname || currentUser.username,
      contactPhone: prev.contactPhone || currentUser.phone,
    }));
  }, [currentUser]);

  const displayName = profileUser?.fullname || profileUser?.username || "Môi giới BestRoom";
  const activeRooms = rooms.filter((room) => room.status === "còn phòng");
  const avgRating = rooms.length > 0 ? rooms.reduce((sum, room) => sum + (room.rating || 0), 0) / rooms.length : 5;
  const totalViews = rooms.reduce((sum, room) => sum + (room.interestedCount || 0), 0);
  const mainAreas = useMemo(() => {
    const districts = rooms.map((room) => room.district).filter(Boolean);
    return Array.from(new Set(districts)).slice(0, 6);
  }, [rooms]);
  const isOwnProfile = currentUser?.username === profileUser?.username;
  const hasPostingAccess = currentUser?.role === "admin" || (currentUser?.freePostsRemaining || 0) > 0 || (currentUser?.activePlan?.remainingPosts || 0) > 0;
  const postingSummary = currentUser?.role === "admin"
    ? "Tài khoản admin có thể đăng tin không giới hạn."
    : (currentUser?.activePlan
      ? `Gói ${currentUser.activePlan.planName} còn ${currentUser.activePlan.remainingPosts} lượt đăng.`
      : `Bạn còn ${currentUser?.freePostsRemaining || 0}/3 lượt đăng miễn phí.`);

  const handleProfileTabChange = (tab: string) => {
    setActiveTab(tab);
    if (!profileUser) return;
    const targetUrl = tab === "rooms" ? `/user/${profileUser.username}?tab=rooms` : `/user/${profileUser.username}`;
    router.replace(targetUrl, { scroll: false });
  };

  const handleCopyLink = () => {
    if (typeof window === "undefined") return;
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };

  const handleSaveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!profileUser || !currentUser) return;

    setIsSaving(true);
    setSaveError(null);

    try {
      const response = await fetch(`/api/users/${profileUser.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-user-role": currentUser.role,
          "x-user-id": currentUser.id,
        },
        body: JSON.stringify({
          email: editEmail,
          phone: editPhone,
          avatar: editAvatar,
          fullname: editFullname,
          experienceYears: editExperienceYears,
          workingHours: editWorkingHours,
        }),
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Không thể cập nhật thông tin cá nhân.");

      setProfileUser(data.user);
      setCurrentUser({ ...currentUser, ...data.user });
      localStorage.setItem("bestroom_user", JSON.stringify({ ...currentUser, ...data.user }));
      setIsEditing(false);
    } catch (err: any) {
      setSaveError(err.message || "Lỗi khi lưu thông tin.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploadingAvatar(true);
    setAvatarUploadError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Không thể tải ảnh đại diện.");
      }

      setEditAvatar(data.url);
    } catch (err: any) {
      setAvatarUploadError(err.message || "Không thể tải ảnh đại diện.");
    } finally {
      setIsUploadingAvatar(false);
      event.target.value = "";
    }
  };

  const uploadImageFile = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Không thể tải ảnh lên.");
    }

    return data.url as string;
  };

  const handleUploadListingMainImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploadingListingMainImage(true);
    setListingMainImageError(null);

    try {
      const url = await uploadImageFile(file);
      setListingForm((prev) => {
        const currentImages = Array.isArray(prev.images) ? prev.images.filter(Boolean) : [];
        return {
          ...prev,
          image: url,
          images: [url, ...currentImages.filter((image) => image !== url)],
        };
      });
    } catch (err: any) {
      setListingMainImageError(err.message || "Không thể tải ảnh chính.");
    } finally {
      setIsUploadingListingMainImage(false);
      event.target.value = "";
    }
  };

  const handleUploadListingImages = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    setIsUploadingListingImages(true);
    setListingImagesError(null);

    try {
      const urls = await Promise.all(files.map(uploadImageFile));
      setListingForm((prev) => {
        const currentImages = Array.isArray(prev.images) ? prev.images.filter(Boolean) : [];
        const mergedImages = Array.from(new Set([...currentImages, ...urls]));
        return {
          ...prev,
          image: prev.image || mergedImages[0] || "",
          images: mergedImages,
        };
      });
    } catch (err: any) {
      setListingImagesError(err.message || "Không thể tải danh sách ảnh.");
    } finally {
      setIsUploadingListingImages(false);
      event.target.value = "";
    }
  };

  const openCreateListing = () => {
    if (!currentUser) return;
    if (!hasPostingAccess) {
      router.push("/pricing");
      return;
    }
    setListingForm(createDefaultListingForm(currentUser));
    setCreateListingError(null);
    setEditPanel("listing");
  };

  const openPostedListings = () => {
    setEditPanel("posted");
  };

  const openEditListing = (room: BoardingRoom) => {
    setEditingRoom(room);
    setListingForm({
      ...createDefaultListingForm(currentUser),
      ...room,
      images: Array.isArray(room.images) ? room.images : [room.image].filter(Boolean),
    });
    setUpdateListingError(null);
  };

  const closeEditListing = () => {
    setEditingRoom(null);
    setUpdateListingError(null);
    if (currentUser) {
      setListingForm(createDefaultListingForm(currentUser));
    }
  };

  const handleCreateListing = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!currentUser) return;

    setIsCreatingListing(true);
    setCreateListingError(null);
    try {
      const savedRoom = await roomService.createRoom(listingForm, currentUser.role, currentUser.id);
      setRooms((prev) => [savedRoom, ...prev]);
      if (savedRoom.approvalStatus === "approved") {
        setGlobalRooms((prev) => [savedRoom, ...prev]);
      }
      const refreshedUser = await userService.getUser(currentUser.id);
      const nextUser = { ...currentUser, ...refreshedUser };
      setCurrentUser(nextUser);
      localStorage.setItem("bestroom_user", JSON.stringify(nextUser));
      setEditPanel("profile");
    } catch (err: any) {
      setCreateListingError(err.message || "Không thể tạo tin đăng phòng trọ.");
    } finally {
      setIsCreatingListing(false);
    }
  };

  const handleUpdateListing = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!currentUser || !editingRoom) return;

    setIsUpdatingListing(true);
    setUpdateListingError(null);
    try {
      const updatedRoom = await roomService.updateRoom(editingRoom.id, listingForm, currentUser.role, currentUser.id);
      setRooms((prev) => prev.map((room) => (room.id === updatedRoom.id ? updatedRoom : room)));
      setGlobalRooms((prev) => prev.map((room) => (room.id === updatedRoom.id ? updatedRoom : room)));
      closeEditListing();
      setEditPanel("posted");
    } catch (err: any) {
      setUpdateListingError(err.message || "KhÃ´ng thá»ƒ cáº­p nháº­t tin Ä‘Äƒng phÃ²ng trá».");
    } finally {
      setIsUpdatingListing(false);
    }
  };

  const handleConfirmDeleteListing = async () => {
    if (!currentUser || !deleteTargetRoom) return;

    setIsDeletingListing(true);
    setDeleteListingError(null);
    try {
      await roomService.deleteRoom(deleteTargetRoom.id, currentUser.role, currentUser.id);
      setRooms((prev) => prev.filter((room) => room.id !== deleteTargetRoom.id));
      setGlobalRooms((prev) => prev.filter((room) => room.id !== deleteTargetRoom.id));
      setDeleteTargetRoom(null);
    } catch (err: any) {
      setDeleteListingError(err.message || "KhÃ´ng thá»ƒ xÃ³a tin Ä‘Äƒng phÃ²ng trá».");
    } finally {
      setIsDeletingListing(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto flex max-w-[1200px] flex-col items-center justify-center px-4 py-24">
        <PageLoader text="Đang tải trang đăng tin..." className="py-0" />
      </div>
    );
  }

  if (error || !profileUser) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-red-50 text-red-500">
          <UserRound className="h-8 w-8" />
        </div>
        <h1 className="mt-5 text-2xl font-black text-blue-950">Không tìm thấy hồ sơ</h1>
        <p className="mt-2 text-sm font-semibold text-slate-500">{error || "Tài khoản này không tồn tại."}</p>
        <button
          onClick={() => router.push("/")}
          className="mt-6 inline-flex h-11 items-center gap-2 rounded-lg bg-blue-600 px-6 text-sm font-black text-white hover:bg-blue-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại trang chủ
        </button>
      </div>
    );
  }

  if (isEditPage && !currentUser) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center justify-center px-4 py-24 text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-blue-100 bg-blue-50 text-blue-600">
          <UserRound className="h-8 w-8" />
        </div>
        <h1 className="mt-5 text-2xl font-black text-blue-950">Bạn cần đăng nhập</h1>
        <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
          Vui lòng đăng nhập để chỉnh sửa trang cá nhân hoặc đăng tin phòng trọ.
        </p>
        <button
          onClick={() => router.push("/")}
          className="mt-6 inline-flex h-11 items-center gap-2 rounded-lg bg-blue-600 px-6 text-sm font-black text-white hover:bg-blue-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Về trang chủ
        </button>
      </div>
    );
  }

  if (isEditPage && currentUser && currentUser.role !== "admin" && currentUser.username !== profileUser.username) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center justify-center px-4 py-24 text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-red-100 bg-red-50 text-red-500">
          <ShieldCheck className="h-8 w-8" />
        </div>
        <h1 className="mt-5 text-2xl font-black text-blue-950">Không có quyền truy cập</h1>
        <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
          Bạn chỉ có thể chỉnh sửa trang cá nhân của chính mình.
        </p>
        <button
          onClick={() => router.push(`/user/${profileUser.username}`)}
          className="mt-6 inline-flex h-11 items-center gap-2 rounded-lg bg-blue-600 px-6 text-sm font-black text-white hover:bg-blue-700"
        >
          Xem hồ sơ công khai
        </button>
      </div>
    );
  }

  if (isEditPage) {
    return (
      <>
        <EditProfileView
          profileUser={profileUser}
          currentUser={currentUser}
          rooms={rooms}
          displayName={displayName}
          editFullname={editFullname}
          setEditFullname={setEditFullname}
          editExperienceYears={editExperienceYears}
          setEditExperienceYears={setEditExperienceYears}
          editWorkingHours={editWorkingHours}
          setEditWorkingHours={setEditWorkingHours}
          editEmail={editEmail}
          setEditEmail={setEditEmail}
          editPhone={editPhone}
          setEditPhone={setEditPhone}
          editAvatar={editAvatar}
          setEditAvatar={setEditAvatar}
          isSaving={isSaving}
          saveError={saveError}
          isUploadingAvatar={isUploadingAvatar}
          avatarUploadError={avatarUploadError}
          onUploadAvatar={handleUploadAvatar}
          onSave={handleSaveProfile}
          onCancel={() => router.push(`/user/${profileUser.username}`)}
          onBack={() => router.push(`/user/${profileUser.username}`)}
          onPostRoom={openCreateListing}
          onShowProfile={() => setEditPanel("profile")}
          onShowPostedListings={openPostedListings}
          onEditListing={openEditListing}
          onRequestDeleteListing={(room) => {
            setDeleteTargetRoom(room);
            setDeleteListingError(null);
          }}
          activePanel={editPanel}
          listingForm={listingForm}
          setListingForm={setListingForm}
          isCreatingListing={isCreatingListing}
          createListingError={createListingError}
          onCreateListing={handleCreateListing}
          isUploadingMainImage={isUploadingListingMainImage}
          mainImageError={listingMainImageError}
          onUploadMainImage={handleUploadListingMainImage}
          isUploadingGalleryImages={isUploadingListingImages}
          galleryImageError={listingImagesError}
          onUploadGalleryImages={handleUploadListingImages}
          canEdit={isOwnProfile}
          hasPostingAccess={Boolean(hasPostingAccess)}
          postingSummary={postingSummary}
          onGoPricing={() => router.push("/pricing")}
        />
        {editingRoom && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
            <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
              <div className="flex items-start justify-between border-b border-slate-100 px-7 py-5">
                <div>
                  <h2 className="text-2xl font-black text-blue-950">Chỉnh sửa Thông Tin Phòng Trọ</h2>
                  <p className="mt-1 text-sm font-semibold text-slate-500">Nhập đầy đủ thông tin bên dưới để đồng bộ cơ sở dữ liệu.</p>
                </div>
                <button type="button" onClick={closeEditListing} className="grid h-10 w-10 place-items-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-blue-950">
                  <X className="h-6 w-6" />
                </button>
              </div>
              <CreateListingPanel
                form={listingForm}
                setForm={setListingForm}
                isSubmitting={isUpdatingListing}
                error={updateListingError}
                onCancel={closeEditListing}
                onSubmit={handleUpdateListing}
                isUploadingMainImage={isUploadingListingMainImage}
                mainImageError={listingMainImageError}
                onUploadMainImage={handleUploadListingMainImage}
                isUploadingGalleryImages={isUploadingListingImages}
                galleryImageError={listingImagesError}
                onUploadGalleryImages={handleUploadListingImages}
                currentUser={currentUser}
                hasPostingAccess
                postingSummary="Chỉnh sửa thông tin phòng trọ hiện có. Tin sau khi lưu sẽ được đồng bộ lại hệ thống."
                onGoPricing={() => router.push("/pricing")}
                title="Chỉnh sửa Thông Tin Phòng Trọ"
                description="Nhập đầy đủ thông tin bên dưới để đồng bộ cơ sở dữ liệu."
                submitLabel="Lưu thay đổi"
                submittingLabel="Đang lưu..."
                compactHeader
              />
            </div>
          </div>
        )}
        {deleteTargetRoom && (
          <div className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 text-center shadow-2xl">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-red-50 text-red-600">
                <Trash2 className="h-7 w-7" />
              </div>
              <h2 className="mt-4 text-xl font-black text-blue-950">Có chắc chắn muốn xóa không?</h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
                Tin "{deleteTargetRoom.title}" sẽ bị xóa khỏi hệ thống.
              </p>
              {deleteListingError && <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm font-bold text-red-600">{deleteListingError}</p>}
              <div className="mt-6 grid grid-cols-2 gap-3">
                <button type="button" onClick={() => setDeleteTargetRoom(null)} className="h-11 rounded-lg border border-slate-200 text-sm font-black text-slate-700 hover:bg-slate-50">
                  Không
                </button>
                <button type="button" disabled={isDeletingListing} onClick={handleConfirmDeleteListing} className="h-11 rounded-lg bg-red-600 text-sm font-black text-white hover:bg-red-700 disabled:opacity-60">
                  {isDeletingListing ? "Đang xóa..." : "Có, xóa"}
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="bg-[#f8fbff]">
      <div className="mx-auto max-w-[1200px] px-4 py-5 sm:px-6 lg:px-8">
        <div className="grid gap-5 lg:grid-cols-[1fr_390px]">
          <main className="min-w-0 space-y-4">
            <section className="rounded-lg border border-blue-100 bg-white p-5 shadow-sm">
              <div className="grid gap-6 md:grid-cols-[190px_1fr]">
                <div className="flex flex-col items-center gap-4">
                  <div className="relative h-36 w-36 overflow-hidden rounded-full bg-blue-100">
                    {profileUser.avatar ? (
                      <img src={profileUser.avatar} alt={displayName} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="grid h-full w-full place-items-center text-4xl font-black text-blue-600">
                        {profileUser.username.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <span className="absolute bottom-3 right-3 grid h-9 w-9 place-items-center rounded-full bg-blue-600 text-white ring-4 ring-white">
                      <ShieldCheck className="h-5 w-5 fill-white" />
                    </span>
                  </div>
                  <a href={phoneHref(profileUser.phone)} className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 text-sm font-black text-white hover:bg-blue-700">
                    <Phone className="h-4 w-4" />
                    Gọi ngay
                  </a>
                    </div>

                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-3xl font-black text-blue-950">{displayName}</h1>
                  </div>
                  <p className="mt-3 text-sm font-semibold text-slate-600">
                    Chuyên phòng trọ, căn hộ mini khu vực {mainAreas.slice(0, 2).join(" - ") || "TP. HCM"}.
                  </p>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <StatTile icon={Building2} value={`${activeRooms.length || rooms.length}`} label="tin hoạt động" />
                    <StatTile icon={Users} value={String(scheduleCount)} label="Khách đã đặt lịch" />
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-lg border border-blue-100 bg-white shadow-sm">
              <div className="flex overflow-x-auto border-b border-blue-100 px-4">
                {["Giới thiệu", "Tin đăng"].map((tab, index) => {
                  const id = ["about", "rooms", "areas", "reviews", "awards"][index];
                  return (
                    <button
                      key={id}
                      onClick={() => handleProfileTabChange(id)}
                      className={`min-w-max border-b-2 px-5 py-3 text-sm font-black ${
                        activeTab === id ? "border-blue-600 text-blue-600" : "border-transparent text-slate-600"
                      }`}
                    >
                      {tab}
                    </button>
                  );
                })}
              </div>

              <div className="p-5">
                {activeTab === "about" ? (
                  <>
                    <h2 className="text-lg font-black text-blue-950">Giới thiệu</h2>
                    <p className="mt-3 text-sm font-semibold leading-7 text-slate-700">
                      Xin chào! Tôi là {displayName}, chuyên hỗ trợ tìm phòng trọ và căn hộ mini khu vực {mainAreas.slice(0, 3).join(", ") || profileUser.username}. Với dữ liệu tin đăng hiện có trên BestRoom, tôi luôn ưu tiên thông tin minh bạch, phản hồi nhanh và lịch xem phòng thuận tiện.
                    </p>
                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      <FeaturePill icon={Eye} title="Tư vấn tận tâm" text="Lắng nghe nhu cầu" />
                      <FeaturePill icon={Camera} title="Thông tin chính xác" text="Hình ảnh thật, giá thật" />
                      <FeaturePill icon={ShieldCheck} title="Không phí ẩn" text="Minh bạch, rõ ràng" />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleProfileTabChange("rooms")}
                      className="mt-5 ml-auto flex items-center gap-2 text-sm font-black text-blue-600 hover:text-blue-800"
                    >
                      Xem tất cả tin ({rooms.length})
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <h2 className="text-lg font-black text-blue-950">Tin đăng phòng trọ</h2>
                      <span className="text-sm font-black text-blue-600">{rooms.length} tin đăng</span>
                    </div>
                    {rooms.length > 0 ? (
                      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        {rooms.map((room) => (
                          <ProfileRoomCard key={room.id} room={room} />
                        ))}
                      </div>
                    ) : (
                      <EmptyCard text="Môi giới này chưa có tin đăng đang hiển thị." />
                    )}
                  </>
                )}
              </div>
            </section>


          </main>

          <aside className="space-y-4">

            <SidebarCard title="Thông tin liên hệ">
              <ContactRow
                icon={Phone}
                label={isPhoneVisible ? profileUser.phone : maskPhone(profileUser.phone)}
                action={isPhoneVisible ? "Ẩn số" : "Hiện số"}
                onAction={() => setIsPhoneVisible((visible) => !visible)}
              />
              <ContactRow icon={MessageCircle} label="Zalo" action="Nhắn Zalo" href={`https://zalo.me/${profileUser.phone}`} />
              <InfoRow icon={CalendarDays} label="Giờ làm việc" value={profileUser.workingHours || "8:00 - 21:00 (T2 - CN)"} />
            </SidebarCard>

            <SidebarCard title="An toàn khi giao dịch với môi giới">
              {["Thông tin môi giới đã được xác minh", "Không thu bất kỳ khoản phí nào từ khách thuê", "Hỗ trợ khách hàng 24/7 từ BestRoom"].map((text) => (
                <p key={text} className="mt-3 flex gap-2 text-sm font-semibold text-slate-600">
                  <Check className="h-4 w-4 text-emerald-600" />
                  {text}
                </p>
              ))}
              <button className="mt-4 flex items-center gap-2 text-sm font-black text-blue-600">
                Tìm hiểu thêm
                <ArrowRight className="h-4 w-4" />
              </button>
            </SidebarCard>
          </aside>
        </div>

      </div>

      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
          <form onSubmit={handleSaveProfile} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-black text-blue-950">Chỉnh sửa thông tin</h2>
              <button type="button" onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-blue-950">
                <X className="h-5 w-5" />
              </button>
            </div>
            <EditInput label="Họ và tên" value={editFullname} onChange={setEditFullname} />
            <EditInput label="Email" value={editEmail} onChange={setEditEmail} type="email" required />
            <EditInput label="Số điện thoại" value={editPhone} onChange={setEditPhone} required />
            <EditInput label="Link avatar" value={editAvatar} onChange={setEditAvatar} />
            {saveError && <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm font-bold text-red-600">{saveError}</p>}
            <div className="mt-5 flex justify-end gap-3">
              <button type="button" onClick={() => setIsEditing(false)} className="h-10 rounded-lg border border-slate-200 px-5 text-sm font-black text-slate-600">Hủy</button>
              <button disabled={isSaving} className="h-10 rounded-lg bg-blue-600 px-5 text-sm font-black text-white hover:bg-blue-700 disabled:bg-slate-300">
                {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function StatTile({ icon: Icon, value, label }: { icon: React.ElementType; value: string; label: string }) {
  return (
    <div className="rounded-lg border border-blue-100 bg-white p-3 text-center">
      <Icon className="mx-auto mb-1 h-5 w-5 text-blue-600" />
      <p className="text-lg font-black text-blue-600">{value}</p>
      <p className="text-[11px] font-semibold text-slate-500">{label}</p>
    </div>
  );
}

function CreateListingPanel({
  form,
  setForm,
  isSubmitting,
  error,
  onCancel,
  onSubmit,
  isUploadingMainImage,
  mainImageError,
  onUploadMainImage,
  isUploadingGalleryImages,
  galleryImageError,
  onUploadGalleryImages,
  currentUser,
  hasPostingAccess,
  postingSummary,
  onGoPricing,
  title = "Thêm phòng trọ mới vào hệ thống",
  description = "Nhập đầy đủ thông tin bên dưới để đăng bài cho khách thuê tiếp cận.",
  submitLabel = "Đăng tin phòng trọ",
  submittingLabel = "Đang tạo tin...",
  compactHeader = false,
}: {
  form: Partial<BoardingRoom>;
  setForm: React.Dispatch<React.SetStateAction<Partial<BoardingRoom>>>;
  isSubmitting: boolean;
  error: string | null;
  onCancel: () => void;
  onSubmit: (event: React.FormEvent) => void;
  isUploadingMainImage: boolean;
  mainImageError: string | null;
  onUploadMainImage: (event: React.ChangeEvent<HTMLInputElement>) => void;
  isUploadingGalleryImages: boolean;
  galleryImageError: string | null;
  onUploadGalleryImages: (event: React.ChangeEvent<HTMLInputElement>) => void;
  currentUser: User | null;
  hasPostingAccess: boolean;
  postingSummary: string;
  onGoPricing: () => void;
  title?: string;
  description?: string;
  submitLabel?: string;
  submittingLabel?: string;
  compactHeader?: boolean;
}) {
  const updateField = <K extends keyof BoardingRoom>(key: K, value: BoardingRoom[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const toggles: Array<{ key: keyof BoardingRoom; label: string }> = [
    { key: "hasWifi", label: "Kết nối Wifi miễn phí" },
    { key: "isSharedOwner", label: "Sống chung chủ nhà" },
    { key: "hasElevator", label: "Thang máy nội khu" },
    { key: "hasBalcony", label: "Có ban công rộng" },
    { key: "hasMezzanine", label: "Có gác lửng" },
    { key: "hasFurniture", label: "Đầy đủ nội thất" },
    { key: "hasAirConditioner", label: "Có máy lạnh" },
    { key: "hasContract", label: "Có hợp đồng thuê" },
    { key: "isPeopleLimited", label: "Giới hạn số người ở" },
  ];

  return (
    <form onSubmit={onSubmit} className="space-y-3">

      <section className="overflow-hidden rounded-lg border border-blue-100 bg-white shadow-sm">
        {!compactHeader && (
          <div className="flex items-start justify-between border-b border-slate-100 bg-white px-6 py-5">
            <div>
              <h2 className="text-2xl font-black text-blue-950">{title}</h2>
              <p className="mt-1 text-sm font-semibold text-slate-500">{description}</p>
            </div>
          </div>
        )}
        <div className="px-6 py-5">
          {/* <div className={`mb-5 rounded-xl border px-4 py-3 text-sm font-semibold ${hasPostingAccess ? "border-blue-100 bg-blue-50 text-blue-800" : "border-amber-200 bg-amber-50 text-amber-800"}`}>
            <p>{postingSummary}</p>
            {!hasPostingAccess && currentUser?.role !== "admin" && (
              <button type="button" onClick={onGoPricing} className="mt-3 inline-flex h-10 items-center rounded-lg bg-[#ffc400] px-4 text-sm font-black text-slate-950 hover:bg-amber-300">
                Mua gói đăng tin
              </button>
            )}
          </div> */}
          <section className="border-b border-slate-100 pb-5">
            <SectionTitle index="1" title="Thông tin bắt buộc" />
            <ListingTextInput
              label="Tiêu đề tin đăng"
              required
              value={form.title || ""}
              placeholder="Ví dụ: Phòng trọ khép kín mới xây gần trung tâm..."
              onChange={(value) => updateField("title", value)}
            />
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <ListingTextInput label="Giá thuê / tháng (VND)" required type="number" value={String(form.price || "")} onChange={(value) => updateField("price", Number(value))} />
              <ListingTextInput label="Diện tích sử dụng (m2)" required type="number" value={String(form.area || "")} onChange={(value) => updateField("area", Number(value))} />
              <ListingSelect label="Loại phòng" value={form.roomType || "Phòng trọ"} onChange={(value) => updateField("roomType", value as BoardingRoom["roomType"])} options={[...ROOM_TYPE_OPTIONS]} />
            </div>
          </section>

          <section className="border-b border-slate-100 py-5">
            <SectionTitle index="2" title="Địa chỉ chi tiết" />
            <div className="grid gap-4 md:grid-cols-2">
              <ListingTextInput label="Tỉnh / Thành phố" required value={form.city || ""} onChange={(value) => updateField("city", value)} />
              <ListingTextInput label="Quận / Huyện" required value={form.district || ""} onChange={(value) => updateField("district", value)} />
              <ListingTextInput label="Phường / Xã" required value={form.ward || ""} onChange={(value) => updateField("ward", value)} />
              <ListingTextInput label="Tên đường" required value={form.street || ""} onChange={(value) => updateField("street", value)} />
            </div>
            <div className="mt-4">
              <ListingTextInput label="Địa chỉ chi tiết" required value={form.addressDetailed || ""} onChange={(value) => updateField("addressDetailed", value)} />
            </div>
          </section>

          <section className="border-b border-slate-100 py-5">
            <SectionTitle index="3" title="Tiện nghi & quy chế phòng trọ" />
            <div className="grid gap-3 md:grid-cols-2">
              {toggles.map((item) => (
                <ListingToggle
                  key={String(item.key)}
                  label={item.label}
                  checked={Boolean(form[item.key])}
                  onChange={(checked) => updateField(item.key as any, checked as any)}
                />
              ))}
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <ListingSelect label="Phí nước sinh hoạt" value={form.waterFeeType || "có phí"} onChange={(value) => updateField("waterFeeType", value as any)} options={["có phí", "miễn phí"]} />
              <ListingSelect label="Bãi đậu xe máy" value={form.parkingFeeType || "miễn phí"} onChange={(value) => updateField("parkingFeeType", value as any)} options={["miễn phí", "có phí"]} />
              <ListingSelect label="Trạng thái phòng" value={form.status || "còn phòng"} onChange={(value) => updateField("status", value as any)} options={["còn phòng", "hết phòng"]} />
              <ListingSelect label="Giờ giấc ra vào" value={form.hoursType || "tự do"} onChange={(value) => updateField("hoursType", value as any)} options={["tự do", "cố định"]} />
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <ListingTextInput label="Năm xây dựng" type="number" value={String(form.buildYear || "")} onChange={(value) => updateField("buildYear", Number(value))} />
              <ListingTextInput label="Giá điện (VND/kWh)" type="number" value={String(form.electricityPrice || "")} onChange={(value) => updateField("electricityPrice", Number(value))} />
              <ListingTextInput label="Số người tối đa" type="number" value={String(form.maxPeople || "")} onChange={(value) => updateField("maxPeople", Number(value))} />
            </div>
          </section>

          <section className="pt-5">
            <SectionTitle index="4" title="Thông tin liên hệ & mô tả" />
            <div className="grid gap-4 md:grid-cols-2">
              <ListingTextInput label="Tên người liên hệ" required value={form.contactName || ""} onChange={(value) => updateField("contactName", value)} />
              <ListingTextInput label="Số điện thoại" required value={form.contactPhone || ""} onChange={(value) => updateField("contactPhone", value)} />
            </div>
            <div className="mt-4">
              <label className="text-sm font-black text-slate-700">Mô tả chi tiết</label>
              <textarea
                value={form.description || ""}
                onChange={(event) => updateField("description", event.target.value)}
                placeholder="Mô tả ưu điểm phòng, khu vực xung quanh, điều kiện thuê..."
                className="mt-2 min-h-28 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>
            <div className="mt-4">
              <ListingImageUploader
                form={form}
                setForm={setForm}
                isUploadingMainImage={isUploadingMainImage}
                mainImageError={mainImageError}
                onUploadMainImage={onUploadMainImage}
                isUploadingGalleryImages={isUploadingGalleryImages}
                galleryImageError={galleryImageError}
                onUploadGalleryImages={onUploadGalleryImages}
              />
            </div>
          </section>

          {error && <p className="mt-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-600">{error}</p>}
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4">
          <button type="button" onClick={onCancel} className="h-11 rounded-lg border border-slate-300 bg-white px-7 text-sm font-black text-slate-700 hover:bg-slate-100">
            Hủy
          </button>
          <button disabled={isSubmitting || !hasPostingAccess} className="inline-flex h-11 items-center gap-2 rounded-lg bg-[#ffc400] px-7 text-sm font-black text-slate-950 shadow hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-70">
            <Save className="h-4 w-4" />
            {isSubmitting ? submittingLabel : submitLabel}
          </button>
        </div>
      </section>
    </form>
  );
}

function ListingImageUploader({
  form,
  setForm,
  isUploadingMainImage,
  mainImageError,
  onUploadMainImage,
  isUploadingGalleryImages,
  galleryImageError,
  onUploadGalleryImages,
}: {
  form: Partial<BoardingRoom>;
  setForm: React.Dispatch<React.SetStateAction<Partial<BoardingRoom>>>;
  isUploadingMainImage: boolean;
  mainImageError: string | null;
  onUploadMainImage: (event: React.ChangeEvent<HTMLInputElement>) => void;
  isUploadingGalleryImages: boolean;
  galleryImageError: string | null;
  onUploadGalleryImages: (event: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  const [showMainUrlInput, setShowMainUrlInput] = useState(false);
  const [showGalleryUrlInput, setShowGalleryUrlInput] = useState(false);
  const galleryImages = Array.isArray(form.images) ? form.images.filter(Boolean) : [];

  const updateMainImageUrl = (value: string) => {
    setForm((prev) => {
      const currentImages = Array.isArray(prev.images) ? prev.images.filter(Boolean) : [];
      return {
        ...prev,
        image: value,
        images: value ? [value, ...currentImages.filter((image) => image !== value)] : currentImages,
      };
    });
  };

  const updateGalleryUrl = (index: number, value: string) => {
    setForm((prev) => {
      const nextImages = [...(Array.isArray(prev.images) ? prev.images : [])];
      nextImages[index] = value;
      const cleanImages = nextImages.filter(Boolean);
      return {
        ...prev,
        image: prev.image || cleanImages[0] || "",
        images: cleanImages,
      };
    });
  };

  const removeGalleryImage = (imageUrl: string) => {
    setForm((prev) => {
      const nextImages = (Array.isArray(prev.images) ? prev.images : []).filter((image) => image && image !== imageUrl);
      return {
        ...prev,
        image: prev.image === imageUrl ? nextImages[0] || "" : prev.image,
        images: nextImages,
      };
    });
  };

  const addGalleryUrlInput = () => {
    setShowGalleryUrlInput(true);
    setForm((prev) => ({
      ...prev,
      images: [...(Array.isArray(prev.images) ? prev.images : []), ""],
    }));
  };

  return (
    <div className="space-y-4">
      <div>
        <div className="mb-2 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-black text-slate-700">Ảnh đại diện phòng trọ <span className="text-red-500">*</span></p>
            <p className="text-xs font-semibold text-slate-400">Tải ảnh chính để tin đăng hiển thị nổi bật hơn.</p>
          </div>
          <button
            type="button"
            onClick={() => setShowMainUrlInput((value) => !value)}
            className="text-xs font-black text-blue-600 hover:text-blue-700"
          >
            {showMainUrlInput ? "Ẩn nhập URL thủ công" : "Nhập URL thủ công"}
          </button>
        </div>

        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-3">
          {form.image ? (
            <div className="relative overflow-hidden rounded-xl bg-white">
              <img src={form.image} alt="Ảnh đại diện phòng trọ" className="h-48 w-full object-cover" referrerPolicy="no-referrer" />
              <label className="absolute bottom-3 right-3 inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg bg-white/95 px-4 text-xs font-black text-blue-600 shadow hover:bg-blue-50">
                {isUploadingMainImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                {isUploadingMainImage ? "Đang tải..." : "Thay ảnh"}
                <input type="file" accept="image/*" onChange={onUploadMainImage} disabled={isUploadingMainImage} className="hidden" />
              </label>
            </div>
          ) : (
            <label className="flex h-48 cursor-pointer flex-col items-center justify-center rounded-xl bg-white text-center text-slate-500 transition hover:bg-blue-50">
              {isUploadingMainImage ? <Loader2 className="mb-3 h-8 w-8 animate-spin text-blue-600" /> : <ImageIcon className="mb-3 h-9 w-9 text-blue-600" />}
              <span className="text-sm font-black text-blue-950">{isUploadingMainImage ? "Đang tải ảnh..." : "Tải ảnh chính lên"}</span>
              <span className="mt-1 text-xs font-semibold text-slate-400">JPG, PNG, WebP. Nên dùng ảnh ngang rõ nét.</span>
              <input type="file" accept="image/*" onChange={onUploadMainImage} disabled={isUploadingMainImage} className="hidden" />
            </label>
          )}
        </div>

        {showMainUrlInput && (
          <input
            value={form.image || ""}
            onChange={(event) => updateMainImageUrl(event.target.value)}
            placeholder="Dán link ảnh chính..."
            className="mt-3 h-11 w-full rounded-xl border border-slate-200 px-4 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />
        )}
        {mainImageError && <p className="mt-2 text-xs font-bold text-red-600">{mainImageError}</p>}
      </div>

      <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-black text-slate-700">Danh sách ảnh phụ ({galleryImages.length} ảnh)</p>
            <p className="text-xs font-semibold text-slate-400">Thêm các góc chụp khác để khách thuê xem phòng rõ hơn.</p>
          </div>
          <button
            type="button"
            onClick={() => setShowGalleryUrlInput((value) => !value)}
            className="text-xs font-black text-blue-600 hover:text-blue-700"
          >
            {showGalleryUrlInput ? "Ẩn nhập URL thủ công" : "Nhập URL thủ công"}
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {galleryImages.map((imageUrl, index) => (
            <div key={`${imageUrl || "manual"}-${index}`} className="relative overflow-hidden rounded-xl border border-slate-200 bg-white">
              {imageUrl ? (
                <img src={imageUrl} alt={`Ảnh phụ ${index + 1}`} className="h-28 w-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <div className="grid h-28 place-items-center text-xs font-bold text-slate-400">URL ảnh</div>
              )}
              <button
                type="button"
                onClick={() => removeGalleryImage(imageUrl)}
                className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-white/95 text-slate-500 shadow hover:text-red-500"
                aria-label="Xóa ảnh"
              >
                <X className="h-4 w-4" />
              </button>
              {showGalleryUrlInput && (
                <input
                  value={imageUrl}
                  onChange={(event) => updateGalleryUrl(index, event.target.value)}
                  placeholder="URL ảnh phụ..."
                  className="h-9 w-full border-t border-slate-100 px-2 text-xs font-semibold outline-none"
                />
              )}
            </div>
          ))}

          <label className="flex h-28 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white text-center hover:bg-blue-50">
            {isUploadingGalleryImages ? <Loader2 className="mb-2 h-6 w-6 animate-spin text-blue-600" /> : <Camera className="mb-2 h-6 w-6 text-slate-500" />}
            <span className="text-xs font-black text-slate-600">{isUploadingGalleryImages ? "Đang tải..." : "Thêm ảnh"}</span>
            <input type="file" accept="image/*" multiple onChange={onUploadGalleryImages} disabled={isUploadingGalleryImages} className="hidden" />
          </label>

          {showGalleryUrlInput && (
            <button
              type="button"
              onClick={addGalleryUrlInput}
              className="flex h-28 flex-col items-center justify-center rounded-xl border border-dashed border-blue-300 bg-blue-50 text-xs font-black text-blue-600 hover:bg-blue-100"
            >
              <ImageIcon className="mb-2 h-6 w-6" />
              Thêm ô URL
            </button>
          )}
        </div>
        {galleryImageError && <p className="mt-2 text-xs font-bold text-red-600">{galleryImageError}</p>}
      </div>
    </div>
  );
}

function SectionTitle({ index, title }: { index: string; title: string }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <span className="text-sm font-black text-slate-400">{index}.</span>
      <h3 className="text-sm font-black uppercase tracking-[0.12em] text-slate-500">{title}</h3>
    </div>
  );
}

function ListingTextInput({
  label,
  value,
  onChange,
  type = "text",
  required = false,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-black text-slate-700">{label}{required ? " *" : ""}</span>
      <input
        type={type}
        required={required}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-4 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
      />
    </label>
  );
}

function ListingSelect({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="text-sm font-black text-slate-700">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
      >
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  );
}

function ListingToggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="flex h-14 items-center justify-between rounded-xl bg-slate-50 px-4 text-sm font-black text-slate-700">
      {label}
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-5 w-5 rounded border-slate-300 accent-blue-600"
      />
    </label>
  );
}

function EditProfileView({
  profileUser,
  currentUser,
  rooms,
  displayName,
  editFullname,
  setEditFullname,
  editExperienceYears,
  setEditExperienceYears,
  editWorkingHours,
  setEditWorkingHours,
  editEmail,
  setEditEmail,
  editPhone,
  setEditPhone,
  editAvatar,
  setEditAvatar,
  isSaving,
  saveError,
  isUploadingAvatar,
  avatarUploadError,
  onUploadAvatar,
  onSave,
  onCancel,
  onBack,
  onPostRoom,
  onShowProfile,
  onShowPostedListings,
  onEditListing,
  onRequestDeleteListing,
  activePanel,
  listingForm,
  setListingForm,
  isCreatingListing,
  createListingError,
  onCreateListing,
  isUploadingMainImage,
  mainImageError,
  onUploadMainImage,
  isUploadingGalleryImages,
  galleryImageError,
  onUploadGalleryImages,
  canEdit,
  hasPostingAccess,
  postingSummary,
  onGoPricing,
}: {
  profileUser: User;
  currentUser: User | null;
  rooms: BoardingRoom[];
  displayName: string;
  editFullname: string;
  setEditFullname: (value: string) => void;
  editExperienceYears: string;
  setEditExperienceYears: (value: string) => void;
  editWorkingHours: string;
  setEditWorkingHours: (value: string) => void;
  editEmail: string;
  setEditEmail: (value: string) => void;
  editPhone: string;
  setEditPhone: (value: string) => void;
  editAvatar: string;
  setEditAvatar: (value: string) => void;
  isSaving: boolean;
  saveError: string | null;
  isUploadingAvatar: boolean;
  avatarUploadError: string | null;
  onUploadAvatar: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onSave: (event: React.FormEvent) => void;
  onCancel: () => void;
  onBack: () => void;
  onPostRoom: () => void;
  onShowProfile: () => void;
  onShowPostedListings: () => void;
  onEditListing: (room: BoardingRoom) => void;
  onRequestDeleteListing: (room: BoardingRoom) => void;
  activePanel: "profile" | "listing" | "posted";
  listingForm: Partial<BoardingRoom>;
  setListingForm: React.Dispatch<React.SetStateAction<Partial<BoardingRoom>>>;
  isCreatingListing: boolean;
  createListingError: string | null;
  onCreateListing: (event: React.FormEvent) => void;
  isUploadingMainImage: boolean;
  mainImageError: string | null;
  onUploadMainImage: (event: React.ChangeEvent<HTMLInputElement>) => void;
  isUploadingGalleryImages: boolean;
  galleryImageError: string | null;
  onUploadGalleryImages: (event: React.ChangeEvent<HTMLInputElement>) => void;
  canEdit: boolean;
  hasPostingAccess: boolean;
  postingSummary: string;
  onGoPricing: () => void;
}) {
  const activeRooms = rooms.filter((room) => room.status === "còn phòng");
  const areas = Array.from(new Set(rooms.map((room) => room.district).filter(Boolean)));
  return (
    <div className="bg-[#f8fbff]">
      <div className="mx-auto max-w-[1200px] px-4 py-5 sm:px-6 lg:px-8">
        {!canEdit && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-800">
            Bạn đang xem trang chỉnh sửa của tài khoản khác. Các trường được hiển thị để xem trước và không nên lưu thay đổi.
          </div>
        )}

        <div className="grid gap-5 lg:grid-cols-[220px_1fr]">
          <aside className="space-y-4">
            <section className="rounded-lg border border-blue-100 bg-white p-5 text-center shadow-sm">
              <div className="relative mx-auto h-28 w-28 overflow-hidden rounded-full bg-blue-100">
                {editAvatar ? (
                  <img src={editAvatar} alt={displayName} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="grid h-full w-full place-items-center text-3xl font-black text-blue-600">
                    {profileUser.username.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <span className="absolute bottom-1 right-1 grid h-8 w-8 place-items-center rounded-full bg-blue-600 text-white ring-4 ring-white">
                  <Settings className="h-4 w-4" />
                </span>
              </div>
              <h2 className="mt-4 text-xl font-black text-blue-950">{editFullname || displayName}</h2>
            </section>

            <section className="rounded-lg border border-blue-100 bg-white p-3 shadow-sm">
              {[
                { icon: UserRound, label: "Thông tin cá nhân", active: activePanel === "profile", onClick: onShowProfile },
                { icon: Building2, label: "Đăng tin phòng trọ", active: activePanel === "listing", onClick: onPostRoom },
                { icon: Eye, label: "Tin \u0111\u00e3 \u0111\u0103ng", active: activePanel === "posted", onClick: onShowPostedListings },
              ].map(({ icon: Icon, label, active, onClick }) => (
                <button
                  key={label}
                  type="button"
                  onClick={onClick}
                  className={`mb-1 flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-black ${
                    active ? "bg-blue-50 text-blue-600" : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {label}
                </button>
              ))}
            </section>

          </aside>

          {activePanel === "listing" ? (
            <CreateListingPanel
              form={listingForm}
              setForm={setListingForm}
              isSubmitting={isCreatingListing}
              error={createListingError}
              onCancel={onShowProfile}
              onSubmit={onCreateListing}
              isUploadingMainImage={isUploadingMainImage}
              mainImageError={mainImageError}
              onUploadMainImage={onUploadMainImage}
              isUploadingGalleryImages={isUploadingGalleryImages}
              galleryImageError={galleryImageError}
              onUploadGalleryImages={onUploadGalleryImages}
              currentUser={currentUser}
              hasPostingAccess={Boolean(hasPostingAccess)}
              postingSummary={postingSummary}
              onGoPricing={onGoPricing}
            />
          ) : activePanel === "posted" ? (
            <PostedListingsPanel
              rooms={rooms}
              onEdit={onEditListing}
              onDelete={onRequestDeleteListing}
            />
          ) : (
          <form id="edit-profile-form" onSubmit={onSave} className="space-y-3">
            <EditPanel title="1. Thông tin cơ bản">
              <div className="grid gap-5 lg:grid-cols-[150px_1fr]">
                <div>
                  <p className="mb-3 text-sm font-black text-blue-950">Ảnh đại diện</p>
                  <div className="h-24 w-24 overflow-hidden rounded-full bg-blue-100">
                    {editAvatar ? (
                      <img src={editAvatar} alt="Ảnh đại diện" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="grid h-full w-full place-items-center text-2xl font-black text-blue-600">{profileUser.username.slice(0, 2).toUpperCase()}</div>
                    )}
                  </div>
                  <label className={`mt-3 flex h-9 w-fit items-center gap-2 rounded-lg border px-4 text-xs font-black ${
                    isUploadingAvatar
                      ? "cursor-wait border-slate-200 bg-slate-50 text-slate-400"
                      : "cursor-pointer border-blue-500 text-blue-600 hover:bg-blue-50"
                  }`}>
                    {isUploadingAvatar ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                    {isUploadingAvatar ? "Đang tải..." : "Tải ảnh lên"}
                    <input
                      type="file"
                      accept="image/*"
                      disabled={isUploadingAvatar || !canEdit}
                      onChange={onUploadAvatar}
                      className="hidden"
                    />
                  </label>
                  <p className="mt-2 text-[11px] font-semibold text-slate-400">Định dạng: JPG, PNG. Tối đa 2MB.</p>
                  {avatarUploadError && (
                    <p className="mt-2 text-[11px] font-bold text-red-600">{avatarUploadError}</p>
                  )}
                </div>

                <div className="space-y-4">
                  <EditInput label="Họ và tên" value={editFullname} onChange={setEditFullname} placeholder={displayName} />
                  <EditInput label="Số năm kinh nghiệm" value={editExperienceYears} onChange={setEditExperienceYears} placeholder="Ví dụ: 3 năm" />
                  <label className="block">
                    <span className="mb-1 block text-sm font-black text-blue-950">Tiêu đề hồ sơ</span>
                    <textarea
                      rows={2}
                      defaultValue={`Chuyên cho thuê phòng trọ, căn hộ mini khu vực ${areas.slice(0, 2).join(" - ") || "TP. HCM"}`}
                      className="w-full resize-none rounded-lg border border-blue-100 px-3 py-2 text-sm font-semibold outline-none focus:border-blue-500"
                    />
                  </label>
                </div>
              </div>
            </EditPanel>

            <EditPanel title="2. Thông tin liên hệ">
              <div className="grid gap-4 md:grid-cols-3">
                <EditInput label="Số điện thoại" value={editPhone} onChange={setEditPhone} required />
                <EditInput label="Email" value={editEmail} onChange={setEditEmail} type="email" required />
                <EditInput label="Zalo" value={editPhone} onChange={setEditPhone} />
                <EditInput label="Facebook" value={`facebook.com/${profileUser.username}`} onChange={() => undefined} />
                <EditSelect
                  label="Giờ làm việc"
                  value={editWorkingHours}
                  onChange={setEditWorkingHours}
                  options={[
                    "8:00 - 21:00 (T2 - CN)",
                    "7:00 - 22:00 (T2 - CN)",
                    "9:00 - 18:00 (T2 - T6)",
                    "Luôn sẵn sàng",
                  ]}
                />
                <EditInput label="Địa chỉ" value="123 Nguyễn Đình Chiểu, P.6, Q.3, TP. HCM" onChange={() => undefined} />
              </div>
            </EditPanel>

            <div className="grid gap-3">
              <EditPanel title="3. Giới thiệu bản thân">
                <textarea
                  rows={5}
                  defaultValue={`Tôi là ${displayName}, có kinh nghiệm hỗ trợ thuê phòng trọ và căn hộ mini tại ${areas.slice(0, 3).join(", ") || "TP. HCM"}.\nLuôn đặt uy tín lên hàng đầu, thông tin minh bạch, phản hồi nhanh và hỗ trợ nhiệt tình để khách thuê có trải nghiệm tốt nhất.`}
                  className="w-full resize-none rounded-lg border border-blue-100 p-3 text-sm font-semibold leading-6 outline-none focus:border-blue-500"
                />
                <p className="mt-1 text-right text-xs font-semibold text-slate-400">256/500 ký tự</p>
              </EditPanel>

              </div>

            {saveError && <p className="rounded-lg bg-red-50 p-3 text-sm font-bold text-red-600">{saveError}</p>}

            <div className="flex justify-end gap-3 rounded-lg border border-blue-100 bg-white p-5 shadow-sm">
              <button type="button" onClick={onCancel} className="h-11 rounded-lg border border-slate-300 px-8 text-sm font-black text-blue-950 hover:bg-slate-50">
                Hủy
              </button>
              <button type="submit" disabled={isSaving || !canEdit} className="flex h-11 items-center justify-center gap-2 rounded-lg bg-blue-600 px-8 text-sm font-black text-white hover:bg-blue-700 disabled:bg-slate-300">
                <Save className="h-5 w-5" />
                {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </div>
          </form>
          )}
        </div>
      </div>
    </div>
  );
}

function FeaturePill({ icon: Icon, title, text }: { icon: React.ElementType; title: string; text: string }) {
  return (
    <div className="flex items-center gap-3 border-r border-blue-100 last:border-r-0">
      <span className="grid h-9 w-9 place-items-center rounded-full bg-blue-50 text-blue-600">
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <p className="text-sm font-black text-blue-950">{title}</p>
        <p className="text-xs font-semibold text-slate-500">{text}</p>
      </div>
    </div>
  );
}

function EditPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-blue-100 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-lg font-black text-blue-950">{title}</h2>
      {children}
    </section>
  );
}

function SelectLike({ label, value }: { label: string; value: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-black text-blue-950">{label}</span>
      <div className="flex h-10 items-center justify-between rounded-lg border border-blue-100 px-3 text-sm font-semibold text-slate-700">
        <span className="truncate">{value}</span>
        <ChevronDown className="h-4 w-4 text-slate-400" />
      </div>
    </label>
  );
}

function SectionHeader({ title, action }: { title: string; action: string }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-lg font-black text-blue-950">{title}</h2>
      <button className="flex items-center gap-2 text-sm font-black text-blue-600">
        {action}
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}

function PostedListingsPanel({
  rooms,
  onEdit,
  onDelete,
}: {
  rooms: BoardingRoom[];
  onEdit: (room: BoardingRoom) => void;
  onDelete: (room: BoardingRoom) => void;
}) {
  return (
    <section className="rounded-lg border border-blue-100 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-blue-950">Tin đã đăng</h2>
          <p className="mt-1 text-sm font-semibold text-slate-500">Danh sách phòng trọ mà tài khoản này đã đăng.</p>
        </div>
        <span className="rounded-full bg-blue-50 px-4 py-2 text-sm font-black text-blue-600">{rooms.length} tin</span>
      </div>

      {rooms.length > 0 ? (
        <div className="space-y-3">
          {rooms.map((room) => (
            <article key={room.id} className="grid gap-4 rounded-xl border border-blue-100 bg-white p-3 shadow-sm sm:grid-cols-[150px_1fr_auto]">
              <img
                src={room.image || room.images?.[0] || "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=500&q=80"}
                alt={room.title}
                className="h-32 w-full rounded-lg object-cover sm:h-28"
                referrerPolicy="no-referrer"
              />
              <div className="min-w-0">
                <h3 className="line-clamp-2 text-base font-black text-blue-950">{room.title}</h3>
                <p className="mt-1 text-lg font-black text-blue-600">{formatVND(room.price)}</p>
                <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-slate-500">
                  <MapPin className="h-4 w-4" />
                  <span className="line-clamp-1">{[room.district, room.city].filter(Boolean).join(", ") || room.addressDetailed}</span>
                </p>
                <div className="mt-2 flex flex-wrap gap-2 text-xs font-bold text-slate-500">
                  <span>{room.area} m²</span>
                  <span>{room.roomType || "Phòng trọ"}</span>
                  <span>{room.approvalStatus === "pending" ? "Chờ duyệt" : room.approvalStatus === "rejected" ? "Bị từ chối" : "Đang hiển thị"}</span>
                </div>
              </div>
              <div className="flex gap-2 sm:flex-col sm:justify-center">
                <button
                  type="button"
                  onClick={() => onEdit(room)}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-blue-500 px-4 text-sm font-black text-blue-600 hover:bg-blue-50"
                >
                  <Eye className="h-4 w-4" />
                  View
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(room)}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-red-200 px-4 text-sm font-black text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                  Xóa
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyCard text="Tài khoản này chưa đăng phòng trọ nào." />
      )}
    </section>
  );
}

function ProfileRoomCard({ room }: { room: BoardingRoom }) {
  return (
    <article className="overflow-hidden rounded-lg border border-blue-100 bg-white shadow-sm">
      <div className="relative h-28">
        <img src={room.image || room.images?.[0] || "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=500&q=80"} alt={room.title} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
        <Heart className="absolute right-3 top-3 h-5 w-5 text-white drop-shadow" />
      </div>
      <div className="p-3">
        <h3 className="line-clamp-1 text-sm font-black text-blue-950">{room.title}</h3>
        <p className="mt-1 text-base font-black text-blue-600">{formatVND(room.price)}</p>
        <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-slate-500">
          <MapPin className="h-3.5 w-3.5" />
          {room.district || room.city}
        </p>
        <div className="mt-2 flex gap-3 text-[11px] font-semibold text-slate-500">
          <span>{room.area} m²</span>
          <span>{room.hasWifi ? "Wi-Fi" : "WC riêng"}</span>
          <span>{room.hasAirConditioner ? "Máy lạnh" : "Nội thất"}</span>
        </div>
        <Link href={roomDetailPath(room.id)} className="mt-3 flex h-8 w-full items-center justify-center rounded-md border border-blue-500 text-xs font-black text-blue-600 hover:bg-blue-50">
          Xem chi tiết
        </Link>
      </div>
    </article>
  );
}

function EmptyCard({ text }: { text: string }) {
  return <div className="rounded-lg border border-blue-100 bg-white p-10 text-center text-sm font-semibold text-slate-400">{text}</div>;
}

function SidebarCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-blue-100 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-black text-blue-950">{title}</h2>
      {children}
    </section>
  );
}

function Metric({ value, label }: { value: string | number; label: string }) {
  return (
    <div>
      <p className="text-xl font-black text-blue-600">{value}</p>
      <p className="text-[11px] font-semibold text-slate-500">{label}</p>
    </div>
  );
}

function ContactRow({
  icon: Icon,
  label,
  action,
  href,
  onAction,
}: {
  icon: React.ElementType;
  label: string;
  action: string;
  href?: string;
  onAction?: () => void;
}) {
  return (
    <div className="mt-4 flex items-center justify-between gap-3">
      <span className="flex items-center gap-3 text-sm font-black text-blue-600">
        <Icon className="h-5 w-5" />
        {label}
      </span>
      {onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="rounded-lg border border-blue-100 bg-white px-4 py-2 text-xs font-black text-blue-600 hover:bg-blue-50"
        >
          {action}
        </button>
      ) : (
        <a href={href || "#"} className="rounded-lg border border-blue-100 px-4 py-2 text-xs font-black text-blue-600 hover:bg-blue-50">
          {action}
        </a>
      )}
    </div>
  );
}

function InfoRow({ icon: Icon, label, value, green = false }: { icon: React.ElementType; label: string; value: string; green?: boolean }) {
  return (
    <div className="mt-3 flex items-center justify-between gap-3 text-sm font-semibold">
      <span className="flex items-center gap-3 text-blue-950">
        <Icon className="h-4 w-4 text-blue-600" />
        {label}
      </span>
      {value && <strong className={green ? "text-emerald-600" : "text-blue-950"}>{value}</strong>}
    </div>
  );
}

function ReviewCard({ name, text }: { name: string; text: string }) {
  return (
    <article className="rounded-lg border border-blue-100 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-full bg-blue-100 text-sm font-black text-blue-600">
          {name.slice(0, 2).toUpperCase()}
        </div>
        <div>
          <p className="text-sm font-black text-blue-950">{name}</p>
          <div className="mt-1 flex">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star key={star} className="h-4 w-4 fill-amber-400 text-amber-400" />
            ))}
          </div>
        </div>
      </div>
      <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">{text}</p>
    </article>
  );
}

function EditInput({
  label,
  value,
  onChange,
  type = "text",
  required = false,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="mt-3 block">
      <span className="mb-1 block text-sm font-black text-blue-950">{label}</span>
      <input
        type={type}
        required={required}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-lg border border-blue-100 px-3 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
      />
    </label>
  );
}

function EditSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <label className="mt-3 block">
      <span className="mb-1 block text-sm font-black text-blue-950">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-lg border border-blue-100 bg-white px-3 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function maskPhone(phone: string) {
  if (!phone) return "Chưa cập nhật";
  if (phone.length < 7) return phone;
  return `${phone.slice(0, 4)} *** ${phone.slice(-3)}`;
}

function phoneHref(phone: string) {
  const normalized = phone.replace(/[^\d+]/g, "");
  return normalized ? `tel:${normalized}` : "#";
}
