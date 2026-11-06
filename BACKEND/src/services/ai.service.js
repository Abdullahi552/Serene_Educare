import prisma from '../utils/prisma.js';
import AppError from '../utils/AppError.js';

export const getConversations = async (schoolId, userId) => {
    return await prisma.aiConversation.findMany({
        where: { schoolId, userId },
        orderBy: { updatedAt: 'desc' },
        select: { id: true, title: true, updatedAt: true }
    });
};

export const getConversationById = async (schoolId, userId, id) => {
    const conversation = await prisma.aiConversation.findFirst({
        where: { id, schoolId, userId },
        include: { messages: { orderBy: { createdAt: 'asc' } } }
    });
    if (!conversation) throw new AppError('Conversation not found', 404);
    return conversation;
};

export const deleteConversation = async (schoolId, userId, id) => {
    const conversation = await prisma.aiConversation.findFirst({
        where: { id, schoolId, userId }
    });
    if (!conversation) throw new AppError('Conversation not found', 404);
    
    await prisma.aiConversation.delete({ where: { id } });
};

export const sendMessage = async (schoolId, userId, { message, conversationId }) => {
    if (!message || message.trim() === '') {
        throw new AppError('Message cannot be empty', 422, null, { message: 'Required' });
    }

    let conversation;
    
    // 1. Find or create the conversation
    if (conversationId) {
        conversation = await prisma.aiConversation.findFirst({
            where: { id: conversationId, schoolId, userId }
        });
        if (!conversation) throw new AppError('Conversation not found', 404);
    } else {
        conversation = await prisma.aiConversation.create({
            data: {
                schoolId,
                userId,
                title: message.substring(0, 30) + (message.length > 30 ? '...' : '')
            }
        });
    }

    // 2. Save the User's message
    await prisma.aiMessage.create({
        data: {
            conversationId: conversation.id,
            role: 'user',
            content: message
        }
    });

    // 3. Generate the AI response (Mocked for now - integrate with OpenAI/Gemini here)
    const aiContent = `This is a mock response to: "${message}". In production, this would be grounded in your school's health protocols.`;
    
    // 4. Save the Assistant's message
    const aiMessage = await prisma.aiMessage.create({
        data: {
            conversationId: conversation.id,
            role: 'assistant',
            content: aiContent,
            attachments: [] // Optional policy PDFs can go here
        }
    });

    // Update conversation's updatedAt timestamp
    await prisma.aiConversation.update({
        where: { id: conversation.id },
        data: { updatedAt: new Date() }
    });

    return { conversationId: conversation.id, message: aiMessage };
};