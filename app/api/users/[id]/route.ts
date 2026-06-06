import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ensureSchema, sql } from "@/lib/db";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureSchema();
    const { id: userIdToUpdate } = await params;

    if (!userIdToUpdate) {
      return NextResponse.json({ error: "User ID is required." }, { status: 400 });
    }

    const currentUserId = request.headers.get("x-user-id");
    const currentUserRole = request.headers.get("x-user-role");

    // Security Check: User can update their own profile, or Admin can update anyone
    const isSelfUpdate = currentUserId === userIdToUpdate;
    const isAdmin = currentUserRole === "admin";

    if (!isSelfUpdate && !isAdmin) {
      return NextResponse.json(
        { error: "Quyền truy cập bị từ chối. Bạn chỉ có thể cập nhật thông tin của chính mình!" },
        { status: 403 }
      );
    }

    const body = await request.json();
    
    if (isSelfUpdate) {
      // User is updating their own info: email, phone, avatar
      const { email, phone, avatar } = body;
      
      // Basic validation
      if (!email || !phone) {
        return NextResponse.json(
          { error: "Email và số điện thoại không được để trống." },
          { status: 400 }
        );
      }

      // Check email uniqueness if email changed
      if (email) {
        const emailCheck = await sql`
          SELECT id FROM users 
          WHERE LOWER(email) = LOWER(${email}) AND id != ${userIdToUpdate}
        `;
        if (emailCheck.length > 0) {
          return NextResponse.json(
            { error: "Địa chỉ email này đã được sử dụng bởi tài khoản khác." },
            { status: 400 }
          );
        }
      }

      const rows = await sql`
        UPDATE users 
        SET email = ${email}, phone = ${phone}, avatar = ${avatar || ''} 
        WHERE id = ${userIdToUpdate} 
        RETURNING id, username, email, phone, role, avatar
      `;

      if (rows.length === 0) {
        return NextResponse.json({ error: "Không tìm thấy người dùng." }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        user: {
          id: rows[0].id,
          username: rows[0].username,
          email: rows[0].email,
          phone: rows[0].phone,
          role: rows[0].role,
          avatar: rows[0].avatar || "",
        }
      });

    } else {
      // Admin is updating user's role
      const { role } = body;
      if (role !== "admin" && role !== "user") {
        return NextResponse.json(
          { error: "Vai trò không hợp lệ. Chỉ chấp nhận 'admin' hoặc 'user'." },
          { status: 400 }
        );
      }

      const rows = await sql`
        UPDATE users 
        SET role = ${role} 
        WHERE id = ${userIdToUpdate} 
        RETURNING id, username, email, phone, role, avatar
      `;

      if (rows.length === 0) {
        return NextResponse.json({ error: "Không tìm thấy người dùng." }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        user: {
          id: rows[0].id,
          username: rows[0].username,
          email: rows[0].email,
          phone: rows[0].phone,
          role: rows[0].role,
          avatar: rows[0].avatar || "",
        }
      });
    }
  } catch (err: any) {
    return NextResponse.json(
      { error: "Server error: " + err.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureSchema();
    const { id: userIdToDelete } = await params;

    if (!userIdToDelete) {
      return NextResponse.json({ error: "User ID is required." }, { status: 400 });
    }

    // Security Check
    const userRole = request.headers.get("x-user-role");
    if (userRole !== "admin") {
      return NextResponse.json(
        { error: "Quyền truy cập bị từ chối. Chỉ tài khoản Admin mới có quyền xoá người dùng!" },
        { status: 403 }
      );
    }

    // Prevent Admin from deleting themselves (optional but recommended safety check)
    const currentUserId = request.headers.get("x-user-id");
    if (userIdToDelete === currentUserId) {
      return NextResponse.json(
        { error: "Bạn không thể tự xoá tài khoản Admin của chính mình!" },
        { status: 400 }
      );
    }

    const rows = await sql`
      DELETE FROM users 
      WHERE id = ${userIdToDelete} 
      RETURNING id
    `;

    if (rows.length === 0) {
      return NextResponse.json({ error: "Không tìm thấy người dùng để xoá." }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Người dùng và toàn bộ bài đăng liên quan đã được xoá thành công."
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Server error: " + err.message },
      { status: 500 }
    );
  }
}
