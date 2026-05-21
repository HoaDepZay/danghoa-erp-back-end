# SKILL: Real-time Chat Module (Socket.IO)

**Scope**: WebSocket communication, real-time messaging, room management, chat persistence

**Apply to**: Any work on `chatRoutes.ts`, `chatSocket.ts`, `chatController.ts`, `chatService.ts`, `chatRepository.ts`

**Files**: `controllers/chatController.ts`, `services/chatService.ts`, `repositories/chatRepository.ts`, `routers/chatRoutes.ts`, `sockets/chatSocket.ts`

---

## 💬 Chat System Overview

The chat system supports **3 types of communication**:

1. **Direct (1-1)**: Private messages between two employees
2. **Group**: Custom team chat rooms
3. **Project**: Auto-created per project for team coordination

**Technology**: Socket.IO 4.8.3 for WebSocket real-time communication

---

## 📊 Database Schema

### **PHONG_CHAT Table (Chat Rooms)**

```sql
MAPHONGCHAT     -- Room ID (PK)
LOAI_PHONG      -- Room type: DIRECT, GROUP, PROJECT
TENDA           -- Room name (null for direct)
MO_TA           -- Description
TRANG_THAI      -- Status (ACTIVE, ARCHIVED)
NGAY_TAO        -- Created date
NGAY_CAP_NHAT   -- Updated date
```

### **THANH_VIEN_PHONG_CHAT Table (Room Members)**

```sql
MAPHONGCHAT     -- Room ID (FK)
MANV            -- Employee ID (FK)
NGAY_THAM_GIA   -- Join date
NGAY_ROI_DI     -- Leave date
```

### **TIN_NHAN Table (Messages)**

```sql
MATINNHAN       -- Message ID (PK)
MAPHONGCHAT     -- Room ID (FK)
MANV            -- Sender ID (FK)
NOI_DUNG        -- Message content
NGAY_GUI         -- Sent date
NGAY_CHINH_SUA   -- Edited date
TRANG_THAI      -- Status (SENT, EDITED, DELETED)
```

---

## 🔌 Socket.IO Events

### **Client → Server Events**

```typescript
// Join a room
socket.emit("chat:join_room", {
  roomId: string,
  userId: string,
});

// Send message
socket.emit("chat:send_message", {
  roomId: string,
  content: string,
  userId: string,
});

// Leave room
socket.emit("chat:leave_room", {
  roomId: string,
  userId: string,
});

// Typing indicator
socket.emit("chat:user_typing", {
  roomId: string,
  userId: string,
  isTyping: boolean,
});

// Mark messages as read
socket.emit("chat:mark_read", {
  roomId: string,
  userId: string,
});
```

### **Server → Client Events**

```typescript
// New message (broadcast to room)
socket.emit("chat:new_message", {
  messageId: string,
  content: string,
  userId: string,
  userName: string,
  roomId: string,
  timestamp: Date,
});

// User joined room
socket.emit("chat:user_joined", {
  userId: string,
  userName: string,
  roomId: string,
});

// User left room
socket.emit("chat:user_left", {
  userId: string,
  userName: string,
  roomId: string,
});

// User typing
socket.emit("chat:user_typing_indicator", {
  userId: string,
  userName: string,
  isTyping: boolean,
});

// Error
socket.emit("chat:error", {
  message: string,
});
```

---

## 🛠️ Core Implementation

### **1. Socket Connection Setup**

```typescript
// sockets/chatSocket.ts
import { Server } from "socket.io";

const initChatSocket = (io: Server) => {
  const chatNamespace = io.of("/chat");

  chatNamespace.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    // ✅ Join room
    socket.on("chat:join_room", async (data) => {
      const { roomId, userId } = data;

      // Validate
      if (!roomId || !userId) {
        socket.emit("chat:error", { message: "Invalid room or user ID" });
        return;
      }

      // Check user access to room
      const hasAccess = await chatRepository.checkUserAccess(roomId, userId);
      if (!hasAccess) {
        socket.emit("chat:error", { message: "Access denied" });
        return;
      }

      // Join socket.io room
      socket.join(roomId);

      // Store in database
      await chatService.joinRoom(roomId, userId);

      // Notify others
      chatNamespace.to(roomId).emit("chat:user_joined", {
        userId,
        userName: userId, // Get from cache or query
        roomId,
      });
    });

    // ✅ Send message
    socket.on("chat:send_message", async (data) => {
      const { roomId, content, userId } = data;

      // Validate
      if (!roomId || !content?.trim() || !userId) {
        socket.emit("chat:error", { message: "Invalid message data" });
        return;
      }

      if (content.length > 5000) {
        socket.emit("chat:error", { message: "Message too long" });
        return;
      }

      try {
        // Save to database
        const message = await chatService.saveMessage(roomId, userId, content);

        // Broadcast to room
        chatNamespace.to(roomId).emit("chat:new_message", {
          messageId: message.id,
          content: message.content,
          userId: message.userId,
          roomId,
          timestamp: message.timestamp,
        });

        // Acknowledge sender
        socket.emit("chat:message_sent", { messageId: message.id });
      } catch (error) {
        socket.emit("chat:error", { message: error.message });
      }
    });

    // ✅ Leave room
    socket.on("chat:leave_room", async (data) => {
      const { roomId, userId } = data;

      socket.leave(roomId);

      await chatService.leaveRoom(roomId, userId);

      chatNamespace.to(roomId).emit("chat:user_left", {
        userId,
        roomId,
      });
    });

    // ✅ Typing indicator
    socket.on("chat:user_typing", (data) => {
      const { roomId, userId, isTyping } = data;

      chatNamespace.to(roomId).emit("chat:user_typing_indicator", {
        userId,
        isTyping,
      });
    });

    // ✅ Disconnect
    socket.on("disconnect", async () => {
      console.log(`User disconnected: ${socket.id}`);
    });
  });

  return chatNamespace;
};

export default initChatSocket;
```

### **2. REST API Endpoints**

```typescript
// chatRoutes.ts
router.post(
  "/api/chat/direct-room",
  withUserConnection,
  chatController.createDirectRoom,
);
router.post("/api/chat/groups", withUserConnection, chatController.createGroup);
router.get(
  "/api/chat/projects/:projectId/room",
  withUserConnection,
  chatController.getProjectRoom,
);
router.get(
  "/api/chat/messages/:roomId",
  withUserConnection,
  chatController.getMessages,
);
router.post(
  "/api/chat/messages/:roomId",
  withUserConnection,
  chatController.sendMessage,
);

// chatController.ts

// Create direct (1-1) room
const createDirectRoom = async (req, res) => {
  try {
    const { otherUserId } = req.body;
    const userId = req.userId;

    if (!otherUserId) {
      throw new Error("Other user ID required");
    }

    const room = await chatService.createOrGetDirectRoom(userId, otherUserId);
    res.json({ success: true, data: room });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Create group room
const createGroup = async (req, res) => {
  try {
    const { tenda, members } = req.body;
    const userId = req.userId;

    if (!tenda?.trim()) {
      throw new Error("Group name required");
    }

    if (!Array.isArray(members) || members.length === 0) {
      throw new Error("At least one member required");
    }

    const room = await chatService.createGroup(tenda, [...members, userId]);
    res.status(201).json({ success: true, data: room });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Get project room
const getProjectRoom = async (req, res) => {
  try {
    const { projectId } = req.params;

    const room = await chatService.getOrCreateProjectRoom(projectId);
    res.json({ success: true, data: room });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Get messages
const getMessages = async (req, res) => {
  try {
    const { roomId } = req.params;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const pageSize = Math.max(
      1,
      Math.min(50, parseInt(req.query.pageSize) || 20),
    );

    const messages = await chatService.getMessages(roomId, page, pageSize);
    res.json({ success: true, data: messages });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Send message (REST fallback)
const sendMessage = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { content } = req.body;
    const userId = req.userId;

    if (!content?.trim()) {
      throw new Error("Message content required");
    }

    const message = await chatService.saveMessage(roomId, userId, content);
    res.status(201).json({ success: true, data: message });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
```

### **3. Service Layer**

```typescript
// chatService.ts

const chatService = {
  // Create or get direct room between 2 users
  createOrGetDirectRoom: async (user1: string, user2: string) => {
    // Check if already exists
    const existing = await chatRepository.getDirectRoom(user1, user2);
    if (existing) return existing;

    // Create new room
    const roomId = `DIRECT_${user1}_${user2}`;

    await chatRepository.createRoom({
      maphongchat: roomId,
      loai_phong: "DIRECT",
      trang_thai: "ACTIVE",
    });

    // Add both members
    await chatRepository.addMember(roomId, user1);
    await chatRepository.addMember(roomId, user2);

    return { roomId, members: [user1, user2] };
  },

  // Create group room
  createGroup: async (name: string, members: string[]) => {
    if (!name?.trim()) throw new Error("Group name required");
    if (members.length < 2) throw new Error("Group needs at least 2 members");

    const roomId = `GROUP_${Date.now()}`;

    await chatRepository.createRoom({
      maphongchat: roomId,
      loai_phong: "GROUP",
      tenda: name,
      trang_thai: "ACTIVE",
    });

    // Add all members
    for (const member of members) {
      await chatRepository.addMember(roomId, member);
    }

    return { roomId, tenda: name, members };
  },

  // Get or create project room
  getOrCreateProjectRoom: async (projectId: string) => {
    const roomId = `PROJECT_${projectId}`;

    // Check if exists
    const existing = await chatRepository.getRoomById(roomId);
    if (existing) return existing;

    // Create room for project
    const project = await projectRepository.getByMaDA(projectId);
    if (!project) throw new Error("Project not found");

    await chatRepository.createRoom({
      maphongchat: roomId,
      loai_phong: "PROJECT",
      tenda: `Project: ${project.tenda}`,
      trang_thai: "ACTIVE",
    });

    // Add all project members
    const members = await projectRepository.getProjectMembers(projectId);
    for (const member of members) {
      await chatRepository.addMember(roomId, member.manv);
    }

    return { roomId, members };
  },

  // Save message
  saveMessage: async (roomId: string, userId: string, content: string) => {
    // Validate room exists and user is member
    const room = await chatRepository.getRoomById(roomId);
    if (!room) throw new Error("Room not found");

    const isMember = await chatRepository.checkUserAccess(roomId, userId);
    if (!isMember) throw new Error("Not a member of this room");

    // Save message
    return await chatRepository.saveMessage({
      maphongchat: roomId,
      manv: userId,
      noi_dung: content,
      ngay_gui: new Date(),
      trang_thai: "SENT",
    });
  },

  // Get messages with pagination
  getMessages: async (roomId: string, page: number, pageSize: number) => {
    const offset = (page - 1) * pageSize;
    return await chatRepository.getMessages(roomId, offset, pageSize);
  },

  // Join room (update database)
  joinRoom: async (roomId: string, userId: string) => {
    const isMember = await chatRepository.checkUserAccess(roomId, userId);
    if (!isMember) {
      await chatRepository.addMember(roomId, userId);
    }
  },

  // Leave room
  leaveRoom: async (roomId: string, userId: string) => {
    await chatRepository.removeMember(roomId, userId);
  },
};

export default chatService;
```

### **4. Repository Layer**

```typescript
// chatRepository.ts

const chatRepository = {
  // Create room
  createRoom: async (data) => {
    await appPool
      .request()
      .input("MaPhongChat", sql.VarChar, data.maphongchat)
      .input("LoaiPhong", sql.NVarChar, data.loai_phong)
      .input("TenDa", sql.NVarChar, data.tenda || "")
      .execute("sp_createChatRoom");
  },

  // Get room by ID
  getRoomById: async (roomId: string) => {
    const result = await appPool
      .request()
      .input("MaPhongChat", sql.VarChar, roomId)
      .query("SELECT * FROM PHONG_CHAT WHERE MAPHONGCHAT = @MaPhongChat");
    return result.recordset[0] || null;
  },

  // Get direct room between 2 users
  getDirectRoom: async (user1: string, user2: string) => {
    const result = await appPool
      .request()
      .input("User1", sql.VarChar, user1)
      .input("User2", sql.VarChar, user2).query(`
        SELECT * FROM PHONG_CHAT
        WHERE LOAI_PHONG = 'DIRECT'
        AND MAPHONGCHAT IN (
          SELECT MAPHONGCHAT FROM THANH_VIEN_PHONG_CHAT WHERE MANV = @User1
          INTERSECT
          SELECT MAPHONGCHAT FROM THANH_VIEN_PHONG_CHAT WHERE MANV = @User2
        )
      `);
    return result.recordset[0] || null;
  },

  // Add member to room
  addMember: async (roomId: string, userId: string) => {
    await appPool
      .request()
      .input("MaPhongChat", sql.VarChar, roomId)
      .input("MaNV", sql.VarChar, userId)
      .input("NgayThamGia", sql.Date, new Date())
      .execute("sp_addChatMember");
  },

  // Remove member from room
  removeMember: async (roomId: string, userId: string) => {
    await appPool
      .request()
      .input("MaPhongChat", sql.VarChar, roomId)
      .input("MaNV", sql.VarChar, userId).query(`
        UPDATE THANH_VIEN_PHONG_CHAT
        SET NGAY_ROI_DI = GETDATE()
        WHERE MAPHONGCHAT = @MaPhongChat AND MANV = @MaNV
      `);
  },

  // Check user access
  checkUserAccess: async (roomId: string, userId: string) => {
    const result = await appPool
      .request()
      .input("MaPhongChat", sql.VarChar, roomId)
      .input("MaNV", sql.VarChar, userId).query(`
        SELECT 1 FROM THANH_VIEN_PHONG_CHAT
        WHERE MAPHONGCHAT = @MaPhongChat
        AND MANV = @MaNV
        AND NGAY_ROI_DI IS NULL
      `);
    return result.recordset.length > 0;
  },

  // Save message
  saveMessage: async (data) => {
    const messageId = `MSG_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    await appPool
      .request()
      .input("MatinNhan", sql.VarChar, messageId)
      .input("MaPhongChat", sql.VarChar, data.maphongchat)
      .input("MaNV", sql.VarChar, data.manv)
      .input("NoiDung", sql.NVarChar, data.noi_dung)
      .input("NgayGui", sql.DateTime, data.ngay_gui)
      .execute("sp_saveChatMessage");

    return { id: messageId, ...data };
  },

  // Get messages
  getMessages: async (roomId: string, offset: number, pageSize: number) => {
    const result = await appPool
      .request()
      .input("MaPhongChat", sql.VarChar, roomId)
      .input("Offset", sql.Int, offset)
      .input("PageSize", sql.Int, pageSize).query(`
        SELECT 
          t.MATINNHAN, t.MAPHONGCHAT, t.MANV, 
          nv.HOTEN, t.NOI_DUNG, t.NGAY_GUI, t.TRANG_THAI
        FROM TIN_NHAN t
        LEFT JOIN NHAN_VIEN nv ON t.MANV = nv.MANV
        WHERE t.MAPHONGCHAT = @MaPhongChat
        ORDER BY t.NGAY_GUI DESC
        OFFSET @Offset ROWS
        FETCH NEXT @PageSize ROWS ONLY
      `);
    return result.recordset;
  },
};

export default chatRepository;
```

---

## 🎯 Common Mistakes to Avoid

- ❌ Not validating room access before allowing join
- ❌ Sending sensitive data over WebSocket without encryption
- ❌ Not handling Socket.IO disconnections gracefully
- ❌ Storing unencrypted messages (consider encryption for sensitive data)
- ❌ Not limiting message size (can cause server issues)
- ❌ Allowing unlimited typing indicators (can spam server)
- ❌ Not using transactions for bulk member additions
- ❌ Missing error handling in Socket.IO event handlers
- ❌ Broadcasting to wrong rooms (room IDs must be consistent)
- ❌ Not cleaning up disconnected sockets properly
