export function mapRoomFromDb(row: any): any {
  if (!row) return null;
  return {
    id:               row.id,
    title:            row.title,
    description:      row.description,
    price:            Number(row.price),
    area:             Number(row.area),
    city:             row.city,
    district:         row.district || "",
    ward:             row.ward,
    street:           row.street,
    addressDetailed:  row.address_detailed,
    contactName:      row.contact_name,
    contactPhone:     row.contact_phone,
    image:            row.image,
    images:           Array.isArray(row.images) ? row.images : [],
    isSharedOwner:    !!row.is_shared_owner,
    rating:           Number(row.rating),
    hasWifi:          !!row.has_wifi,
    waterFeeType:     row.water_fee_type,
    status:           row.status,
    hoursType:        row.hours_type,
    buildYear:        Number(row.build_year),
    hasParking:       !!row.has_parking,
    isPeopleLimited:  !!row.is_people_limited,
    maxPeople:        row.max_people ? Number(row.max_people) : undefined,
    hasElevator:      !!row.has_elevator,
    hasContract:      !!row.has_contract,
    hasBalcony:       !!row.has_balcony,
    hasMezzanine:     !!row.has_mezzanine,
    hasFurniture:     !!row.has_furniture,
    hasAirConditioner: !!row.has_air_conditioner,
    electricityPrice: Number(row.electricity_price || 0),
    interestedCount:  Number(row.interested_count || 0),
    ownerId:          row.owner_id || null,
    approvalStatus:   row.approval_status || 'approved',
    rejectionReason:  row.rejection_reason || null,
    createdAt:        row.created_at
      ? new Date(row.created_at).toISOString()
      : new Date().toISOString(),
  };
}

export function mapReviewFromDb(row: any): any {
  if (!row) return null;
  return {
    id:        row.id,
    roomId:    row.room_id,
    userId:    row.user_id,
    username:  row.username,
    rating:    Number(row.rating),
    comment:   row.comment,
    createdAt: row.created_at
      ? new Date(row.created_at).toISOString()
      : new Date().toISOString(),
  };
}

export function mapUserFromDb(row: any): any {
  if (!row) return null;
  return {
    id:       row.id,
    username: row.username,
    email:    row.email,
    phone:    row.phone,
    password: row.password,
    role:     row.role,
    avatar:   row.avatar || "",
    fullname: row.fullname || "",
  };
}
