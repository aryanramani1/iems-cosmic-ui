/* ============================================
   iEMS COSMIC UI - EDUBOT CHATBOT
   Team CODE REAPERS - CVM Hackathon 2026
   Professional AI Chat Assistant
   FIXED: No page redirect on icon click
   ============================================ */

// EduBot Module - IIFE to avoid global scope pollution
(function() {
    'use strict';

    // ========== CONFIGURATION ==========
    const CONFIG = {
        botName: 'EduBot',
        botAvatar: '🤖',
        onlineStatus: 'Online',
        typingDelay: 1000,
        responseDelay: 1500,
        storageKey: 'edubot_conversation',
        maxMessages: 50
    };

    // ========== STATE MANAGEMENT ==========
    let isChatOpen = false;
    let conversationHistory = [];

    // ========== DOM ELEMENTS ==========
    let edubotChat = null;
    let edubotToggle = null;
    let closeBtn = null;
    let chatMessages = null;
    let chatInput = null;
    let sendBtn = null;
    let quickBtns = [];

    // ========== STUDENT DATA (MOCK) ==========
    const studentData = {
        name: 'Rohan Patel',
        enrollment: 'CE101',
        branch: 'Computer Engineering',
        semester: 4,
        cgpa: 8.2,
        attendance: 85,
        subjectAttendance: {
            'Web Development': 93,
            'Database Systems': 87,
            'Data Structures': 67,
            'Operating Systems': 92,
            'Computer Networks': 89
        },
        marks: {
            'Web Development': 42,
            'Database Systems': 38,
            'Data Structures': 45,
            'Operating Systems': 35,
            'Computer Networks': 32
        },
        targetCGPA: 8.5,
        eligibleCompanies: 12,
        topMatches: ['TCS', 'Infosys', 'Wipro'],
        skills: ['Python', 'JavaScript', 'React', 'Node.js', 'SQL'],
        skillGaps: ['AWS', 'Docker', 'System Design'],
        parentPhone: '+91 98765 43210',
        upcomingExams: [
            { subject: 'Web Development', date: '20 Feb 2026', target: 32 },
            { subject: 'Database Systems', date: '25 Feb 2026', target: 35 },
            { subject: 'Data Structures', date: '28 Feb 2026', target: 28 }
        ],
        notices: [
            'Project submission deadline: 20 Feb',
            'Industrial Visit: 25 Feb',
            'Semester exams: 05 Mar'
        ]
    };

    // ========== BOT RESPONSES DATABASE ==========
    const botResponses = {
        greeting: [
            '👋 Hi {name}! I\'m EduBot, your AI assistant. How can I help you today?',
            'Hello {name}! 👋 Ready to assist you with your academic queries!',
            'Hey {name}! What would you like to know about?'
        ],
        attendance: {
            general: '📊 Your current overall attendance is **{attendance}%**. You need 75% to be eligible for exams. You can miss **{canMiss} more classes** this semester.',
            subject: '📚 Your attendance in **{subject}** is **{percentage}%**. {message}',
            high: 'Excellent! Keep it up! ✅',
            good: 'Good. Maintain regular attendance. 👍',
            warning: 'You need {needed} more classes to reach 75%. Please attend regularly. ⚠️',
            critical: '⚠️ **CRITICAL**: Your attendance is below 75%! You need {needed} more classes to be eligible for exams.'
        },
        cgpa: {
            current: '🎯 Your current CGPA is **{cgpa}**. You are in the top {rank}% of your class.',
            target: 'To reach **{target} CGPA**, you need **{marks} marks** in {subject} externals. Current internal: {internal}/50.',
            calculation: 'Your CGPA is calculated as: (SGPA1 + SGPA2 + ... + SGPA{n}) / {n}. Current semester GPA target: {target}'
        },
        placement: {
            eligible: '💼 You are eligible for **{count} companies**. Your top matches are: {companies}',
            match: 'Your best match is **{company}** with **{match}%** match score! Deadline: {deadline}',
            skillGap: '🛠️ Based on your profile, we recommend: {skills}. This could increase your package by {salary}.',
            application: 'You have applied to **{applied}** companies. {shortlisted} shortlisted, {placed} placed.'
        },
        exam: {
            next: '📝 Your next exam is **{subject}** on **{date}**. Current internal: {internal}/50. Target: {target}/50 for {grade} grade.',
            all: 'You have {count} upcoming exams this semester: {list}',
            preparation: 'Focus on {topics} for {subject}. Recommended study time: {hours} hours.'
        },
        skill: {
            current: '🛠️ Your current skills: {skills}',
            recommended: 'Based on placement trends, we recommend: **{skill}** (+{salary} LPA). Would you like learning resources?',
            gap: 'Your skill gap analysis: {gaps}. Start with {priority} for maximum impact.'
        },
        deadline: '⏰ Upcoming deadlines:\n{deadlines}',
        parent: '📱 Parent contact: {phone}. Would you like to send a WhatsApp notification?',
        leave: '📝 You can apply for leave through the "Apply for Leave" button. Maximum {maxLeaves} leaves per semester. You have **{remaining} leaves** remaining.',
        unknown: [
            '🤔 I\'m not sure about that. You can ask me about:',
            '• 📊 Attendance',
            '• 🎯 CGPA & Targets',
            '• 💼 Placements',
            '• 📝 Exams',
            '• 🛠️ Skills',
            '• ⏰ Deadlines',
            '• 📱 Parent notifications',
            '• 📝 Leave applications',
            '',
            'What would you like to know?'
        ],
        error: '😕 Sorry, I encountered an error. Please try again.',
        typing: '🤖 is typing...'
    };

    // ========== UTILITY FUNCTIONS ==========
    function formatMessage(text, params) {
        let formatted = text;
        for (let [key, value] of Object.entries(params)) {
            formatted = formatted.replace(new RegExp(`{${key}}`, 'g'), value);
        }
        return formatted;
    }

    function getRandomResponse(responseArray) {
        if (Array.isArray(responseArray)) {
            return responseArray[Math.floor(Math.random() * responseArray.length)];
        }
        return responseArray;
    }

    function calculateCanMiss() {
        const current = studentData.attendance;
        const required = 75;
        const totalClasses = 100; // Assuming 100 classes total
        const present = Math.round((current / 100) * totalClasses);
        const needed = Math.ceil((required / 100) * totalClasses);
        return Math.max(0, totalClasses - present - (totalClasses - needed));
    }

    function getAttendanceMessage(percentage) {
        if (percentage >= 90) return botResponses.attendance.high;
        if (percentage >= 75) return botResponses.attendance.good;
        if (percentage >= 60) return botResponses.attendance.warning;
        return botResponses.attendance.critical;
    }

    // ========== CHAT MESSAGE HANDLING ==========
    function addMessage(message, isUser = false, isTyping = false) {
        if (!chatMessages) return;

        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isUser ? 'user' : 'bot'} ${isTyping ? 'typing' : ''}`;
        
        const bubble = document.createElement('div');
        bubble.className = 'bubble';
        
        if (isTyping) {
            bubble.innerHTML = '<span class="typing-indicator">...</span>';
        } else if (isUser) {
            bubble.textContent = message;
        } else {
            // Convert markdown-like bold to HTML
            const formattedMessage = message.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            bubble.innerHTML = `<span class="bot-avatar-small">${CONFIG.botAvatar}</span> ${formattedMessage}`;
        }
        
        const time = document.createElement('span');
        time.className = 'time';
        const now = new Date();
        time.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        messageDiv.appendChild(bubble);
        messageDiv.appendChild(time);
        chatMessages.appendChild(messageDiv);
        
        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        // Store in conversation history
        if (!isTyping) {
            conversationHistory.push({
                role: isUser ? 'user' : 'bot',
                message: message,
                timestamp: now.toISOString()
            });
            
            // Keep only last 50 messages
            if (conversationHistory.length > CONFIG.maxMessages) {
                conversationHistory = conversationHistory.slice(-CONFIG.maxMessages);
            }
        }
    }

    function showTypingIndicator() {
        addMessage('', false, true);
    }

    function removeTypingIndicator() {
        if (chatMessages) {
            const typingIndicator = chatMessages.querySelector('.message.typing');
            if (typingIndicator) {
                typingIndicator.remove();
            }
        }
    }

    // ========== BOT RESPONSE GENERATION ==========
    function generateResponse(userMessage) {
        const message = userMessage.toLowerCase().trim();
        
        // Attendance queries
        if (message.includes('attendance') || message.includes('present') || message.includes('absent')) {
            if (message.includes('subject') || message.includes('web') || message.includes('data') || 
                message.includes('operating') || message.includes('database') || message.includes('network')) {
                
                let subject = '';
                let percentage = 0;
                
                if (message.includes('web')) subject = 'Web Development';
                else if (message.includes('data') && message.includes('struct')) subject = 'Data Structures';
                else if (message.includes('database')) subject = 'Database Systems';
                else if (message.includes('operating')) subject = 'Operating Systems';
                else if (message.includes('network')) subject = 'Computer Networks';
                
                if (subject) {
                    percentage = studentData.subjectAttendance[subject] || 0;
                    const needed = Math.ceil((75 - percentage) / 1); // Rough calculation
                    let message = '';
                    
                    if (percentage >= 75) {
                        message = botResponses.attendance.good;
                    } else {
                        message = formatMessage(botResponses.attendance.warning, { needed: needed });
                    }
                    
                    return formatMessage(botResponses.attendance.subject, {
                        subject: subject,
                        percentage: percentage,
                        message: message
                    });
                }
            }
            
            const canMiss = calculateCanMiss();
            return formatMessage(getRandomResponse(botResponses.attendance.general), {
                attendance: studentData.attendance,
                canMiss: canMiss
            });
        }
        
        // CGPA queries
        if (message.includes('cgpa') || message.includes('gpa') || message.includes('grade')) {
            if (message.includes('target') || message.includes('improve') || message.includes('reach')) {
                return formatMessage(botResponses.cgpa.target, {
                    target: studentData.targetCGPA,
                    marks: 32,
                    subject: 'Web Development',
                    internal: studentData.marks['Web Development']
                });
            }
            
            return formatMessage(botResponses.cgpa.current, {
                cgpa: studentData.cgpa,
                rank: 15
            });
        }
        
        // Placement queries
        if (message.includes('placement') || message.includes('job') || message.includes('company') || 
            message.includes('tcs') || message.includes('infosys') || message.includes('microsoft')) {
            
            if (message.includes('skill') || message.includes('gap') || message.includes('learn')) {
                return formatMessage(botResponses.placement.skillGap, {
                    skills: '**AWS Certification**, **Docker**, **System Design**',
                    salary: '3.5-4.2'
                });
            }
            
            if (message.includes('match') || message.includes('best')) {
                return formatMessage(botResponses.placement.match, {
                    company: 'TCS',
                    match: 94,
                    deadline: '20 Feb 2026'
                });
            }
            
            return formatMessage(botResponses.placement.eligible, {
                count: studentData.eligibleCompanies,
                companies: studentData.topMatches.join(', ')
            });
        }
        
        // Exam queries
        if (message.includes('exam') || message.includes('test') || message.includes('internal') || 
            message.includes('external') || message.includes('marks')) {
            
            const nextExam = studentData.upcomingExams[0];
            return formatMessage(botResponses.exam.next, {
                subject: nextExam.subject,
                date: nextExam.date,
                internal: studentData.marks[nextExam.subject],
                target: nextExam.target,
                grade: 'A'
            });
        }
        
        // Skill queries
        if (message.includes('skill') || message.includes('course') || message.includes('certification') || 
            message.includes('learn')) {
            
            if (message.includes('recommend') || message.includes('suggest')) {
                return formatMessage(botResponses.skill.recommended, {
                    skill: 'AWS Certified Cloud Practitioner',
                    salary: 3.5
                });
            }
            
            return formatMessage(botResponses.skill.current, {
                skills: studentData.skills.join(', ')
            });
        }
        
        // Deadline queries
        if (message.includes('deadline') || message.includes('due') || message.includes('submission')) {
            const deadlines = studentData.notices
                .filter(n => n.includes('deadline') || n.includes('submission'))
                .join('\n• ');
            return formatMessage(botResponses.deadline, { deadlines: '• ' + deadlines });
        }
        
        // Parent notification queries
        if (message.includes('parent') || message.includes('whatsapp') || message.includes('mother') || message.includes('father')) {
            return formatMessage(botResponses.parent, { phone: studentData.parentPhone });
        }
        
        // Leave application queries
        if (message.includes('leave') || message.includes('absent') || message.includes('holiday')) {
            return formatMessage(botResponses.leave, {
                maxLeaves: 3,
                remaining: 2
            });
        }
        
        // Greeting
        if (message.includes('hi') || message.includes('hello') || message.includes('hey') || 
            message.includes('good morning') || message.includes('good afternoon') || message.includes('good evening')) {
            return formatMessage(getRandomResponse(botResponses.greeting), { name: studentData.name.split(' ')[0] });
        }
        
        // Help / Unknown
        if (message.includes('help') || message.includes('what') || message.includes('can you')) {
            return botResponses.unknown.join('\n');
        }
        
        // Default response
        return getRandomResponse(botResponses.unknown);
    }

    // ========== EVENT HANDLERS ==========
    function handleSendMessage() {
        if (!chatInput || !chatMessages) return;
        
        const message = chatInput.value.trim();
        if (message === '') return;
        
        // Add user message
        addMessage(message, true);
        chatInput.value = '';
        
        // Show typing indicator
        showTypingIndicator();
        
        // Generate and send response after delay
        setTimeout(() => {
            removeTypingIndicator();
            const response = generateResponse(message);
            addMessage(response, false);
        }, CONFIG.responseDelay);
    }

    // ========== PUBLIC API ==========
    window.toggleEduBot = function() {
        const edubotChat = document.getElementById('edubotChat');
        if (edubotChat) {
            edubotChat.classList.toggle('hidden');
            isChatOpen = !edubotChat.classList.contains('hidden');
            
            // Add welcome message if chat is empty
            if (isChatOpen && chatMessages && chatMessages.children.length === 0) {
                const welcome = formatMessage(getRandomResponse(botResponses.greeting), {
                    name: studentData.name.split(' ')[0]
                });
                addMessage(welcome, false);
            }
        }
        return false; // Prevent default action
    };

    window.sendEduBotMessage = function(message) {
        if (chatInput) {
            chatInput.value = message;
            handleSendMessage();
        }
    };

    window.closeEduBot = function() {
        if (edubotChat) {
            edubotChat.classList.add('hidden');
            isChatOpen = false;
        }
        return false;
    };

    // ========== INITIALIZATION ==========
    function init() {
        // Get DOM elements
        edubotChat = document.getElementById('edubotChat');
        edubotToggle = document.getElementById('edubotToggle');
        closeBtn = document.getElementById('closeEdubot');
        chatMessages = document.getElementById('chatMessages');
        chatInput = document.getElementById('chatInput');
        sendBtn = document.getElementById('sendMessage');
        quickBtns = document.querySelectorAll('.quick-btn');
        
        // Add event listeners
        if (edubotToggle) {
            edubotToggle.addEventListener('click', function(e) {
                e.preventDefault();
                window.toggleEduBot();
            });
        }
        
        if (closeBtn) {
            closeBtn.addEventListener('click', function(e) {
                e.preventDefault();
                window.closeEduBot();
            });
        }
        
        if (sendBtn) {
            sendBtn.addEventListener('click', function(e) {
                e.preventDefault();
                handleSendMessage();
            });
        }
        
        if (chatInput) {
            chatInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSendMessage();
                }
            });
        }
        
        if (quickBtns.length > 0) {
            quickBtns.forEach(btn => {
                btn.addEventListener('click', function(e) {
                    e.preventDefault();
                    const query = this.getAttribute('data-query');
                    let message = '';
                    
                    switch(query) {
                        case 'attendance':
                            message = 'What is my overall attendance?';
                            break;
                        case 'cgpa':
                            message = 'What CGPA do I need for 8.5?';
                            break;
                        case 'placement':
                            message = 'Show my placement recommendations';
                            break;
                        case 'exam':
                            message = 'When is my next exam?';
                            break;
                        case 'skill':
                            message = 'What skills should I learn?';
                            break;
                        case 'deadline':
                            message = 'Show my deadlines';
                            break;
                        case 'parent':
                            message = 'Notify my parents';
                            break;
                        case 'leave':
                            message = 'How to apply for leave?';
                            break;
                        default:
                            message = 'Help';
                    }
                    
                    if (chatInput) {
                        chatInput.value = message;
                        handleSendMessage();
                    }
                });
            });
        }
        
        console.log('✅ EduBot initialized successfully!');
    }

    // Run initialization when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();