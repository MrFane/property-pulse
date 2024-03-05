import connectDB from "@/config/database";
import Message from "@/models/Message";
import { getSessionUser } from "@/utils/getSessionUser";

// /api/messages
export const GET = async (request) => {
  try {
    await connectDB();
    const sessionUser = await getSessionUser();
    if (!sessionUser || !sessionUser.user) {
      return Response.json({ message: "User id is required" }, { status: 401 });
    }
    const { userId } = sessionUser;
    const readMessages = await Message.find({ recipient: userId, read: true })
      .sort({ createdAt: -1 }) // Sort read messages in asc order
      .populate("sender", "username")
      .populate("property", "name");
    const unreadMessages = await Message.find({
      recipient: userId,
      read: false,
    })
      .sort({ createdAt: -1 }) // Sort unread messages in asc order
      .populate("sender", "username")
      .populate("property", "name");
    const messages = [...unreadMessages, ...readMessages];
    return Response.json(messages);
  } catch (error) {
    console.log(error);
    return new Response("Something Went Wrong", { status: 500 });
  }
};

// /api/messages
export const POST = async (request) => {
  try {
    await connectDB();
    const { name, email, phone, message, property, recipient } =
      await request.json();
    const sessionUser = await getSessionUser();
    if (!sessionUser || !sessionUser.user) {
      return Response.json(
        { message: "You must be logged to send the message" },
        { status: 401 }
      );
    }
    const { user } = sessionUser;

    if (user.id === recipient) {
      return Response.json(
        { message: "Can not send a message to yourself" },
        { status: 400 }
      );
    }

    const newMessage = new Message({
      sender: user.id,
      recipient,
      property,
      name,
      email,
      phone,
      body: message,
    });

    await newMessage.save();

    return Response.json({ message: "Message Sent" });
  } catch (error) {
    console.log(error);
    return new Response("Something Went Wrong", { status: 500 });
  }
};
