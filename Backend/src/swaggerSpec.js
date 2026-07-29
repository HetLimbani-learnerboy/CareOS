export const swaggerSpec = {
    openapi: "3.0.0",
    info: {
        title: "CareOS Medical Network API Documentation",
        version: "1.0.0",
        description: "API services for CareOS Revenue Operations, AI Assistant, Consultation, Prescriptions, and Inpatient Care.",
        contact: {
            name: "CareOS Support",
            email: "support@careos.com"
        }
    },
    servers: [
        {
            url: "http://localhost:8000",
            description: "Local Development Server"
        },
        {
            url: "https://careos-backend.vercel.app",
            description: "Production Server (Vercel)"
        }
    ],

    components: {
        securitySchemes: {
            UserEmailHeader: {
                type: "apiKey",
                in: "header",
                name: "x-user-email",
                description: "Authenticated User Email (e.g., patient@careos.com, doctor@careos.com, nurse@careos.com, receptionist@careos.com, lab@careos.com, pharmacy@careos.com)"
            },
            UserRoleHeader: {
                type: "apiKey",
                in: "header",
                name: "x-user-role",
                description: "Optional role override (e.g., Doctor, Nurse, Receptionist, Patient)"
            },
            PatientEmailHeader: {
                type: "apiKey",
                in: "header",
                name: "x-patient-email",
                description: "Patient context email trace header"
            },
            DoctorEmailHeader: {
                type: "apiKey",
                in: "header",
                name: "x-doctor-email",
                description: "Doctor context email trace header"
            }
        }
    },
    security: [
        {
            UserEmailHeader: []
        }
    ],
    paths: {
        "/api/v1/health": {
      get: {
        tags: ["System Health"],
        summary: "System health check endpoint",
        description: "Returns the operational status and deployment health of the CareOS Server Engine.",
        responses: {
          200: {
            description: "Server engine is healthy and operational.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "success" },
                    message: { 
                      type: "string", 
                      example: "CareOS Server Engine is running cleanly on Vercel Edge Serverless..." 
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
        "/api/v1/ai/chat": {
            post: {
                tags: ["AI Assistant"],
                summary: "Process a turn with the CareOS AI Assistant",
                description: "Sends a prompt to the AI assistant. If sessionId is provided, appends to the existing session thread; otherwise creates a new session.",
                parameters: [
                    {
                        in: "header",
                        name: "x-user-email",
                        required: true,
                        schema: { type: "string" },
                        example: "{role}@careos.com",
                        description: "Email of the authenticated user"
                    },
                    {
                        in: "header",
                        name: "x-user-role",
                        required: false,
                        schema: { type: "string" },
                        example: "Doctor",
                        description: "Role of the user (e.g. Doctor, Staff, Receptionist)"
                    }
                ],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["prompt"],
                                properties: {
                                    sessionId: {
                                        type: "string",
                                        example: "66a8db123a167f0b6ee117c2",
                                        description: "Optional ID of an existing chat session"
                                    },
                                    prompt: {
                                        type: "string",
                                        example: "Explain the standard protocol for acute dyslipidemia treatment.",
                                        description: "User query or message for the AI"
                                    }
                                }
                            }
                        }
                    }
                },
                responses: {
                    200: {
                        description: "AI response generated successfully",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        status: { type: "string", example: "success" },
                                        data: {
                                            type: "object",
                                            properties: {
                                                sessionId: { type: "string", example: "66a8db123a167f0b6ee117c2" },
                                                title: { type: "string", example: "Explain the standard protocol for..." },
                                                reply: { type: "string", example: "CareOS Dyslipidemia Management Protocol..." },
                                                lastMessageAt: { type: "string", format: "date-time", example: "2026-07-29T18:20:00.000Z" }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    400: { description: "Missing prompt or required user header" },
                    500: { description: "Server or Groq AI engine failure" }
                }
            }
        },
        "/api/v1/ai/sessions": {
            get: {
                tags: ["AI Assistant"],
                summary: "List all chat sessions for the authenticated user",
                parameters: [
                    {
                        in: "header",
                        name: "x-user-email",
                        required: true,
                        schema: { type: "string" },
                        example: "{role}@careos.com",
                        description: "Email of the authenticated user"
                    }
                ],
                responses: {
                    200: {
                        description: "List of chat sessions retrieved successfully",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        status: { type: "string", example: "success" },
                                        data: {
                                            type: "array",
                                            items: {
                                                type: "object",
                                                properties: {
                                                    _id: { type: "string", example: "66a8db123a167f0b6ee117c2" },
                                                    title: { type: "string", example: "Acute Migraine Treatment" },
                                                    createdAt: { type: "string", format: "date-time" },
                                                    lastMessageAt: { type: "string", format: "date-time" }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    400: { description: "Authenticated user email missing" }
                }
            }
        },
        "/api/v1/ai/sessions/{sessionId}": {
            get: {
                tags: ["AI Assistant"],
                summary: "Get a full chat session message thread by ID",
                parameters: [
                    {
                        in: "path",
                        name: "sessionId",
                        required: true,
                        schema: { type: "string" },
                        example: "66a8db123a167f0b6ee117c2"
                    },
                    {
                        in: "header",
                        name: "x-user-email",
                        required: true,
                        schema: { type: "string" },
                        example: "{role}@careos.com"
                    }
                ],
                responses: {
                    200: {
                        description: "Full chat session details and message array",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        status: { type: "string", example: "success" },
                                        data: {
                                            type: "object",
                                            properties: {
                                                _id: { type: "string", example: "66a8db123a167f0b6ee117c2" },
                                                userEmail: { type: "string", example: "{role}@careos.com" },
                                                userRole: { type: "string", example: "Doctor" },
                                                title: { type: "string", example: "Acute Migraine Protocol" },
                                                messages: {
                                                    type: "array",
                                                    items: {
                                                        type: "object",
                                                        properties: {
                                                            role: { type: "string", enum: ["user", "assistant"], example: "user" },
                                                            content: { type: "string", example: "What is the dosage?" },
                                                            createdAt: { type: "string", format: "date-time" }
                                                        }
                                                    }
                                                },
                                                lastMessageAt: { type: "string", format: "date-time" }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    404: { description: "Chat session not found for this user" }
                }
            },
            patch: {
                tags: ["AI Assistant"],
                summary: "Rename a chat session title",
                parameters: [
                    {
                        in: "path",
                        name: "sessionId",
                        required: true,
                        schema: { type: "string" },
                        example: "66a8db123a167f0b6ee117c2"
                    },
                    {
                        in: "header",
                        name: "x-user-email",
                        required: true,
                        schema: { type: "string" },
                        example: "{role}@careos.com"
                    }
                ],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["title"],
                                properties: {
                                    title: {
                                        type: "string",
                                        example: "Renamed Clinical Consultation Session"
                                    }
                                }
                            }
                        }
                    }
                },
                responses: {
                    200: { description: "Session title updated successfully" },
                    404: { description: "Chat session not found" }
                }
            },
            delete: {
                tags: ["AI Assistant"],
                summary: "Delete a chat session by ID",
                parameters: [
                    {
                        in: "path",
                        name: "sessionId",
                        required: true,
                        schema: { type: "string" },
                        example: "66a8db123a167f0b6ee117c2"
                    },
                    {
                        in: "header",
                        name: "x-user-email",
                        required: true,
                        schema: { type: "string" },
                        example: "{role}@careos.com"
                    }
                ],
                responses: {
                    200: {
                        description: "Session deleted successfully",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        status: { type: "string", example: "success" },
                                        data: {
                                            type: "object",
                                            properties: {
                                                deleted: { type: "boolean", example: true },
                                                sessionId: { type: "string", example: "66a8db123a167f0b6ee117c2" }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    404: { description: "Chat session not found" }
                }
            }
        },
        "/api/v1/receptionist/consultation/request": {
            post: {
                tags: ["Consultation"],
                summary: "Submit a new strategy consultation request",
                description: "Public or patient request submission for enterprise/hospital consultancy strategy.",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["firstName", "lastName", "email", "message"],
                                properties: {
                                    firstName: { type: "string", example: "Rajesh" },
                                    lastName: { type: "string", example: "Sharma" },
                                    email: { type: "string", example: "patient@careos.com" },
                                    message: { type: "string", example: "Seeking technical consultation on legacy EHR integration and cloud migration." }
                                }
                            }
                        }
                    }
                },
                responses: {
                    201: {
                        description: "Consultancy strategy request submitted successfully.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        status: { type: "string", example: "success" },
                                        message: { type: "string", example: "Consultancy strategy request submitted successfully." },
                                        data: {
                                            type: "object",
                                            properties: {
                                                _id: { type: "string", example: "66a8db123a167f0b6ee117c2" },
                                                firstName: { type: "string", example: "Rajesh" },
                                                lastName: { type: "string", example: "Sharma" },
                                                email: { type: "string", example: "patient@careos.com" },
                                                message: { type: "string", example: "Seeking technical consultation..." },
                                                status: { type: "string", example: "Pending" },
                                                createdAt: { type: "string", format: "date-time" },
                                                updatedAt: { type: "string", format: "date-time" }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    400: { description: "Missing required fields or invalid email format" },
                    500: { description: "Server error processing request" }
                }
            }
        },
        "/api/v1/receptionist/consultation/requests": {
            get: {
                tags: ["Consultation"],
                summary: "Fetch all consultation requests for receptionist desk",
                description: "Retrieves all submitted consultation requests sorted by creation date.",
                parameters: [
                    {
                        in: "header",
                        name: "x-user-email",
                        required: true,
                        schema: { type: "string" },
                        example: "receptionist@careos.com",
                        description: "Email of receptionist desk user"
                    }
                ],
                responses: {
                    200: {
                        description: "Consultation records retrieved successfully",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        status: { type: "string", example: "success" },
                                        data: {
                                            type: "array",
                                            items: {
                                                type: "object",
                                                properties: {
                                                    _id: { type: "string", example: "66a8db123a167f0b6ee117c2" },
                                                    firstName: { type: "string", example: "Rajesh" },
                                                    lastName: { type: "string", example: "Sharma" },
                                                    email: { type: "string", example: "patient@careos.com" },
                                                    message: { type: "string", example: "Seeking technical consultation..." },
                                                    status: { type: "string", enum: ["Pending", "Responded", "Archived"], example: "Pending" },
                                                    createdAt: { type: "string", format: "date-time" },
                                                    updatedAt: { type: "string", format: "date-time" }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    500: { description: "Failed to retrieve consultation records" }
                }
            }
        },
        "/api/v1/receptionist/consultation/{id}/status": {
            patch: {
                tags: ["Consultation"],
                summary: "Update status of a consultation request",
                description: "Update a consultation request status to Pending, Responded, or Archived.",
                parameters: [
                    {
                        in: "path",
                        name: "id",
                        required: true,
                        schema: { type: "string" },
                        example: "66a8db123a167f0b6ee117c2",
                        description: "Consultation document MongoDB ID"
                    },
                    {
                        in: "header",
                        name: "x-user-email",
                        required: true,
                        schema: { type: "string" },
                        example: "receptionist@careos.com",
                        description: "Email of receptionist desk user"
                    }
                ],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["status"],
                                properties: {
                                    status: {
                                        type: "string",
                                        enum: ["Pending", "Responded", "Archived"],
                                        example: "Responded"
                                    }
                                }
                            }
                        }
                    }
                },
                responses: {
                    200: {
                        description: "Consultation status updated successfully",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        status: { type: "string", example: "success" },
                                        data: {
                                            type: "object",
                                            properties: {
                                                _id: { type: "string", example: "66a8db123a167f0b6ee117c2" },
                                                firstName: { type: "string", example: "Rajesh" },
                                                lastName: { type: "string", example: "Sharma" },
                                                email: { type: "string", example: "patient@careos.com" },
                                                status: { type: "string", example: "Responded" }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    400: { description: "Invalid status parameter provided" },
                    404: { description: "Consultation request reference not found" }
                }
            }
        },
        "/api/v1/auth/signup": {
            post: {
                tags: ["Authentication"],
                summary: "User registration / signup",
                description: "Registers a new user identity (e.g. Patient, Doctor, Staff) and dispatches an OTP verification code via email.",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["firstName", "email", "phone", "password", "confirmPassword"],
                                properties: {
                                    firstName: { type: "string", example: "Patient" },
                                    lastName: { type: "string", example: "User" },
                                    email: { type: "string", example: "patient@careos.com" },
                                    countryCode: { type: "string", example: "+91" },
                                    phone: { type: "string", example: "9876543210" },
                                    password: { type: "string", example: "Password@123" },
                                    confirmPassword: { type: "string", example: "Password@123" },
                                    role: {
                                        type: "string",
                                        enum: ["hospital_admin", "doctor", "nurse", "lab_technician", "pharmacist", "receptionist", "patient"],
                                        example: "patient"
                                    }
                                }
                            }
                        }
                    }
                },
                responses: {
                    201: {
                        description: "User registered successfully; verification OTP dispatched.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        status: { type: "string", example: "success" },
                                        data: {
                                            type: "object",
                                            properties: {
                                                _id: { type: "string", example: "66a8db123a167f0b6ee117c2" },
                                                id: { type: "number", example: 101 },
                                                firstName: { type: "string", example: "Patient" },
                                                lastName: { type: "string", example: "User" },
                                                email: { type: "string", example: "patient@careos.com" },
                                                phone: { type: "string", example: "9876543210" },
                                                role: { type: "string", example: "patient" },
                                                is_verified: { type: "boolean", example: false }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    400: { description: "Validation failure (DTO errors)" },
                    409: { description: "Identity conflict: Email or phone already registered" }
                }
            }
        },
        "/api/v1/auth/login": {
            post: {
                tags: ["Authentication"],
                summary: "User authentication / login",
                description: "Authenticates user credentials, verifies reCAPTCHA, and issues a JWT token upon successful authorization.",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["email", "password", "captchaToken"],
                                properties: {
                                    email: { type: "string", example: "patient@careos.com" },
                                    password: { type: "string", example: "Password@123" },
                                    captchaToken: { type: "string", example: "resend_bypass" },
                                    rememberMe: { type: "boolean", example: false }
                                }
                            }
                        }
                    }
                },
                responses: {
                    200: {
                        description: "Login successful; JWT token returned.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        status: { type: "string", example: "success" },
                                        user: {
                                            type: "object",
                                            properties: {
                                                _id: { type: "string", example: "66a8db123a167f0b6ee117c2" },
                                                firstName: { type: "string", example: "Patient" },
                                                lastName: { type: "string", example: "User" },
                                                email: { type: "string", example: "patient@careos.com" },
                                                role: { type: "string", example: "patient" },
                                                is_verified: { type: "boolean", example: true }
                                            }
                                        },
                                        token: { type: "string", example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." }
                                    }
                                }
                            }
                        }
                    },
                    401: { description: "Invalid credentials or automated reCAPTCHA verification failure" },
                    403: { description: "Account unverified; fresh OTP sent to email" }
                }
            }
        },
        "/api/v1/auth/verify-otp": {
            post: {
                tags: ["Authentication"],
                summary: "Verify signup / activation OTP code",
                description: "Verifies the 6-digit OTP code sent to user email and activates the user account.",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["email", "otp"],
                                properties: {
                                    email: { type: "string", example: "patient@careos.com" },
                                    otp: { type: "string", example: "123456" }
                                }
                            }
                        }
                    }
                },
                responses: {
                    200: {
                        description: "Account activated successfully.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        status: { type: "string", example: "success" },
                                        message: { type: "string", example: "Account activated successfully" },
                                        data: {
                                            type: "object",
                                            properties: {
                                                user: {
                                                    type: "object",
                                                    properties: {
                                                        _id: { type: "string", example: "66a8db123a167f0b6ee117c2" },
                                                        email: { type: "string", example: "patient@careos.com" },
                                                        is_verified: { type: "boolean", example: true }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    400: { description: "Invalid or expired OTP code" }
                }
            }
        },
        "/api/v1/auth/resend-otp": {
            post: {
                tags: ["Authentication"],
                summary: "Resend activation OTP code",
                description: "Dispatches a fresh verification OTP code to the registered user email.",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["email"],
                                properties: {
                                    email: { type: "string", example: "patient@careos.com" }
                                }
                            }
                        }
                    }
                },
                responses: {
                    200: {
                        description: "Fresh verification code dispatched.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        status: { type: "string", example: "success" },
                                        message: { type: "string", example: "A fresh verification code has been dispatched." }
                                    }
                                }
                            }
                        }
                    },
                    400: { description: "Account is already verified or email missing" }
                }
            }
        },
        "/api/v1/auth/forgot-password-request": {
            post: {
                tags: ["Authentication"],
                summary: "Initiate password reset",
                description: "Sends a 6-digit password reset OTP to the user's registered email address.",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["email"],
                                properties: {
                                    email: { type: "string", example: "patient@careos.com" }
                                }
                            }
                        }
                    }
                },
                responses: {
                    200: {
                        description: "Verification code dispatched if account exists.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        status: { type: "string", example: "success" },
                                        message: { type: "string", example: "A secure 6-digit verification code has been dispatched to your email." }
                                    }
                                }
                            }
                        }
                    },
                    404: { description: "Account association message (security fallback)" }
                }
            }
        },
        "/api/v1/auth/forgot-password-verify-otp": {
            post: {
                tags: ["Authentication"],
                summary: "Verify password reset OTP",
                description: "Validates the password reset OTP prior to allowing credential updating.",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["email", "otp"],
                                properties: {
                                    email: { type: "string", example: "patient@careos.com" },
                                    otp: { type: "string", example: "123456" }
                                }
                            }
                        }
                    }
                },
                responses: {
                    200: {
                        description: "Identity verification successful.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        status: { type: "string", example: "success" },
                                        message: { type: "string", example: "Identity verification handshake successful." }
                                    }
                                }
                            }
                        }
                    },
                    400: { description: "Invalid or expired OTP code" }
                }
            }
        },
        "/api/v1/auth/forgot-password-update": {
            post: {
                tags: ["Authentication"],
                summary: "Update account password",
                description: "Executes password reset update using the verified OTP and new password.",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["email", "otp", "password"],
                                properties: {
                                    email: { type: "string", example: "patient@careos.com" },
                                    otp: { type: "string", example: "123456" },
                                    password: { type: "string", example: "NewPassword@123" }
                                }
                            }
                        }
                    }
                },
                responses: {
                    200: {
                        description: "Password updated successfully.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        status: { type: "string", example: "success" },
                                        message: { type: "string", example: "Credentials updated successfully." }
                                    }
                                }
                            }
                        }
                    },
                    400: { description: "Session expired or missing required parameters" },
                    401: { description: "Unauthorized credential change" }
                }
            }
        },
        "/api/v1/auth/contact-support": {
            post: {
                tags: ["Authentication"],
                summary: "Contact support / send inquiry",
                description: "Forwards contact form support inquiries to Brevo email service.",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["name", "email", "message"],
                                properties: {
                                    name: { type: "string", example: "Patient User" },
                                    email: { type: "string", example: "patient@careos.com" },
                                    message: { type: "string", example: "Unable to schedule consultation session for tomorrow." }
                                }
                            }
                        }
                    }
                },
                responses: {
                    200: {
                        description: "Communications forwarded successfully.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        status: { type: "string", example: "success" },
                                        message: { type: "string", example: "Communications forwarded successfully." }
                                    }
                                }
                            }
                        }
                    },
                    400: { description: "Missing required validation parameters" },
                    500: { description: "Failed to dispatch communications" }
                }
            }
        },
        "/api/v1/patients/dashboard-summary": {
            get: {
                tags: ["Patient Operations"],
                summary: "Get aggregated patient dashboard metrics",
                description: "Retrieves clinical parameters, vitals log, allergies, and chronic conditions for a patient by email.",
                parameters: [
                    {
                        in: "query",
                        name: "email",
                        required: true,
                        schema: { type: "string" },
                        example: "patient@careos.com",
                        description: "Patient email address"
                    }
                ],
                responses: {
                    200: {
                        description: "Metrics summary retrieved successfully.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        status: { type: "string", example: "success" },
                                        data: {
                                            type: "object",
                                            properties: {
                                                patient: {
                                                    type: "object",
                                                    properties: {
                                                        first_name: { type: "string", example: "Patient" },
                                                        last_name: { type: "string", example: "User" },
                                                        email: { type: "string", example: "patient@careos.com" },
                                                        phone: { type: "string", example: "9876543210" }
                                                    }
                                                },
                                                clinical: {
                                                    type: "object",
                                                    properties: {
                                                        allergies: { type: "array", items: { type: "object" } },
                                                        chronic_conditions: { type: "array", items: { type: "object" } },
                                                        vitals_log: {
                                                            type: "object",
                                                            properties: {
                                                                blood_pressure: { type: "string", example: "120/80" },
                                                                heart_rate: { type: "number", example: 72 },
                                                                temperature: { type: "number", example: 98.6 },
                                                                weight: { type: "number", example: 70 }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    400: { description: "Email identifier parameter is required" },
                    404: { description: "User account context missing" }
                }
            },
            post: {
                tags: ["Patient Operations"],
                summary: "Upsert patient clinical dashboard parameters",
                description: "Populates or updates allergies, chronic conditions, and vitals log for a patient.",
                parameters: [
                    {
                        in: "header",
                        name: "x-user-email",
                        required: true,
                        schema: { type: "string" },
                        example: "patient@careos.com",
                        description: "Email of the authenticated user"
                    }
                ],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["email"],
                                properties: {
                                    email: { type: "string", example: "patient@careos.com" },
                                    allergies: {
                                        type: "array",
                                        items: {
                                            type: "object",
                                            properties: {
                                                substance: { type: "string", example: "Penicillin" },
                                                severity: { type: "string", enum: ["Mild", "Moderate", "Severe"], example: "Severe" }
                                            }
                                        }
                                    },
                                    chronic_conditions: {
                                        type: "array",
                                        items: {
                                            type: "object",
                                            properties: {
                                                condition_name: { type: "string", example: "Hypertension" },
                                                status: { type: "string", enum: ["Active", "In Remission", "Managed"], example: "Active" }
                                            }
                                        }
                                    },
                                    vitals_log: {
                                        type: "object",
                                        properties: {
                                            blood_pressure: { type: "string", example: "125/82" },
                                            heart_rate: { type: "number", example: 75 },
                                            temperature: { type: "number", example: 98.4 },
                                            weight: { type: "number", example: 72 }
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                responses: {
                    201: {
                        description: "Dashboard clinical parameters populated successfully.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        status: { type: "string", example: "success" },
                                        message: { type: "string", example: "Dashboard clinical parameters populated successfully." }
                                    }
                                }
                            }
                        }
                    },
                    400: { description: "Email identifier is required" },
                    404: { description: "User reference not found" }
                }
            }
        },
        "/api/v1/patients/profile": {
            get: {
                tags: ["Patient Operations"],
                summary: "Get patient unified profile data",
                description: "Fetches patient identity along with medical/demographic profile information.",
                parameters: [
                    {
                        in: "header",
                        name: "x-user-email",
                        required: true,
                        schema: { type: "string" },
                        example: "patient@careos.com"
                    }
                ],
                responses: {
                    200: {
                        description: "Profile summary retrieved successfully.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        status: { type: "string", example: "success" },
                                        data: {
                                            type: "object",
                                            properties: {
                                                identity: { type: "object" },
                                                medical: { type: "object" }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    404: { description: "Identity account does not exist" }
                }
            },
            put: {
                tags: ["Patient Operations"],
                summary: "Update patient profile and contact info",
                description: "Updates patient identity fields (phone, profile image) and medical demographic profile details.",
                parameters: [
                    {
                        in: "header",
                        name: "x-user-email",
                        required: true,
                        schema: { type: "string" },
                        example: "patient@careos.com"
                    }
                ],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    birth_date: { type: "string", format: "date", example: "1990-05-15" },
                                    gender: { type: "string", enum: ["Male", "Female", "Other"], example: "Male" },
                                    blood_group: { type: "string", example: "O+" },
                                    address: { type: "string", example: "123 Healthcare Boulevard, Suite 400" },
                                    emergency_contact_name1: { type: "string", example: "Jane Doe" },
                                    emergency_contact_phoneno1: { type: "string", example: "9876543211" },
                                    emergency_contact_relation1: { type: "string", example: "Spouse" },
                                    insurance_provider: { type: "string", example: "CareHealth Shield" },
                                    insurance_policynumber: { type: "string", example: "POL998877" }
                                }
                            }
                        }
                    }
                },
                responses: {
                    200: {
                        description: "Profile metadata synchronized and saved successfully.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        status: { type: "string", example: "success" },
                                        message: { type: "string", example: "Profile metadata synchronized and saved successfully." }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        "/api/v1/patients/prescriptions": {
            get: {
                tags: ["Patient Operations"],
                summary: "Fetch patient prescription history",
                description: "Retrieves all clinical prescriptions issued for the authenticated patient.",
                parameters: [
                    {
                        in: "query",
                        name: "patientEmail",
                        required: false,
                        schema: { type: "string" },
                        example: "patient@careos.com"
                    },
                    {
                        in: "header",
                        name: "x-patient-email",
                        required: false,
                        schema: { type: "string" },
                        example: "patient@careos.com"
                    }
                ],
                responses: {
                    200: {
                        description: "Prescription history retrieved successfully.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        status: { type: "string", example: "success" },
                                        count: { type: "number", example: 2 },
                                        data: { type: "array", items: { type: "object" } }
                                    }
                                }
                            }
                        }
                    },
                    400: { description: "Patient email context parameter missing" }
                }
            }
        },
        "/api/v1/patients/prescriptions/{prescriptionId}": {
            get: {
                tags: ["Patient Operations"],
                summary: "Fetch single prescription details",
                description: "Retrieves complete prescription breakdown including diagnosis, medications, and lab requests.",
                parameters: [
                    {
                        in: "path",
                        name: "prescriptionId",
                        required: true,
                        schema: { type: "string" },
                        example: "66a8db123a167f0b6ee117c2"
                    },
                    {
                        in: "query",
                        name: "patientEmail",
                        required: false,
                        schema: { type: "string" },
                        example: "patient@careos.com"
                    }
                ],
                responses: {
                    200: {
                        description: "Prescription details fetched successfully.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        status: { type: "string", example: "success" },
                                        data: { type: "object" }
                                    }
                                }
                            }
                        }
                    },
                    403: { description: "Unauthorized to read this medical record" },
                    404: { description: "Prescription record not found" }
                }
            }
        },
        "/api/v1/patients/my-reports": {
            get: {
                tags: ["Patient Operations"],
                summary: "Fetch patient lab reports history",
                description: "Lists diagnostic lab reports and findings for the patient.",
                parameters: [
                    {
                        in: "header",
                        name: "x-user-email",
                        required: true,
                        schema: { type: "string" },
                        example: "patient@careos.com"
                    }
                ],
                responses: {
                    200: {
                        description: "Lab reports fetched successfully.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        status: { type: "string", example: "success" },
                                        data: { type: "array", items: { type: "object" } }
                                    }
                                }
                            }
                        }
                    },
                    401: { description: "User context missing" }
                }
            }
        },
        "/api/v1/patients/billing-history": {
            get: {
                tags: ["Patient Operations"],
                summary: "Fetch patient historical billing ledger",
                description: "Retrieves partitioned invoice history (Unpaid, Insurance Pending, Paid, Cancelled) for the patient.",
                parameters: [
                    {
                        in: "query",
                        name: "patientEmail",
                        required: false,
                        schema: { type: "string" },
                        example: "patient@careos.com"
                    },
                    {
                        in: "header",
                        name: "x-user-email",
                        required: false,
                        schema: { type: "string" },
                        example: "patient@careos.com"
                    }
                ],
                responses: {
                    200: {
                        description: "Billing history partitioned and returned successfully.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        status: { type: "string", example: "success" },
                                        data: {
                                            type: "object",
                                            properties: {
                                                unpaid: { type: "array", items: { type: "object" } },
                                                insurancePending: { type: "array", items: { type: "object" } },
                                                paid: { type: "array", items: { type: "object" } },
                                                cancelled: { type: "array", items: { type: "object" } }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    401: { description: "Patient session verification required" }
                }
            }
        },
        "/api/v1/patients/invoice/{invoiceId}/pay": {
            post: {
                tags: ["Patient Operations"],
                summary: "Execute patient online payment checkout",
                description: "Processes digital payment (UPI, Card, Net Banking) for an outstanding invoice.",
                parameters: [
                    {
                        in: "path",
                        name: "invoiceId",
                        required: true,
                        schema: { type: "string" },
                        example: "66a8db123a167f0b6ee117c2"
                    },
                    {
                        in: "header",
                        name: "x-user-email",
                        required: true,
                        schema: { type: "string" },
                        example: "patient@careos.com",
                        description: "Email of the authenticated user"
                    }
                ],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["paymentMethod", "transactionId", "cardOrPayerName"],
                                properties: {
                                    patientEmail: { type: "string", example: "patient@careos.com" },
                                    paymentMethod: { type: "string", enum: ["UPI", "Card", "Net_Banking"], example: "UPI" },
                                    transactionId: { type: "string", example: "UTR1234567890" },
                                    cardOrPayerName: { type: "string", example: "Patient User" },
                                    amount: { type: "number", example: 1200 },
                                    paymentTimestamp: { type: "string", format: "date-time" }
                                }
                            }
                        }
                    }
                },
                responses: {
                    200: {
                        description: "Payment processed successfully.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        status: { type: "string", example: "success" },
                                        message: { type: "string", example: "Payment processed successfully." },
                                        data: { type: "object" }
                                    }
                                }
                            }
                        }
                    },
                    400: { description: "Invalid transaction parameters or payment method" }
                }
            }
        },
        "/api/v1/patients/doctors-by-spec": {
            get: {
                tags: ["Patient Booking"],
                summary: "Find doctors by specialization",
                description: "Fetches list of available doctors matching a specific medical specialization.",
                parameters: [
                    {
                        in: "query",
                        name: "specialization",
                        required: true,
                        schema: { type: "string" },
                        example: "Cardiology"
                    },
                    {
                        in: "header",
                        name: "x-user-email",
                        required: true,
                        schema: { type: "string" },
                        example: "patient@careos.com",
                        description: "Email of the authenticated user"
                    }
                ],
                responses: {
                    200: {
                        description: "List of doctors fetched successfully.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        status: { type: "string", example: "success" },
                                        data: {
                                            type: "array",
                                            items: {
                                                type: "object",
                                                properties: {
                                                    name: { type: "string", example: "Dr. Rohan Joshi" },
                                                    email: { type: "string", example: "doctor@careos.com" }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    400: { description: "Specialization query is required" }
                }
            }
        },
        "/api/v1/patients/doctor-slots-live": {
            get: {
                tags: ["Patient Booking"],
                summary: "Get live doctor availability slots for a month",
                description: "Returns available time slots and booking status for a doctor for a specific year and month.",
                parameters: [
                    {
                        in: "header",
                        name: "x-user-email",
                        required: true,
                        schema: { type: "string" },
                        example: "patient@careos.com",
                        description: "Email of the authenticated user"
                    },
                    {
                        in: "query",
                        name: "email",
                        required: true,
                        schema: { type: "string" },
                        example: "doctor@careos.com"
                    },
                    {
                        in: "query",
                        name: "year",
                        required: true,
                        schema: { type: "integer" },
                        example: 2026
                    },
                    {
                        in: "query",
                        name: "month",
                        required: true,
                        schema: { type: "integer" },
                        example: 7
                    }
                ],
                responses: {
                    200: {
                        description: "Doctor monthly slots retrieved successfully.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        status: { type: "string", example: "success" },
                                        data: { type: "object" }
                                    }
                                }
                            }
                        }
                    },
                    400: { description: "Email, year, and month parameters are required" }
                }
            }
        },
        "/api/v1/patients/public-doctor-meta": {
            get: {
                tags: ["Patient Booking"],
                summary: "Get doctor public profile metadata",
                description: "Returns doctor details, qualification, consultation fee, and clinic address.",
                parameters: [
                    {
                        in: "query",
                        name: "email",
                        required: true,
                        schema: { type: "string" },
                        example: "doctor@careos.com"
                    }
                ],
                responses: {
                    200: {
                        description: "Public doctor metadata retrieved successfully.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        status: { type: "string", example: "success" },
                                        data: { type: "object" }
                                    }
                                }
                            }
                        }
                    },
                    404: { description: "Doctor profile not found" }
                }
            }
        },
        "/api/v1/patients/booked-ledger": {
            get: {
                tags: ["Patient Booking"],
                summary: "Fetch booked appointments list for patient",
                description: "Returns all appointments scheduled by the patient.",
                parameters: [
                    {
                        in: "query",
                        name: "email",
                        required: true,
                        schema: { type: "string" },
                        example: "patient@careos.com"
                    }
                ],
                responses: {
                    200: {
                        description: "Appointments list retrieved successfully.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        status: { type: "string", example: "success" },
                                        data: { type: "array", items: { type: "object" } }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        "/api/v1/patients/book-request": {
            post: {
                tags: ["Patient Booking"],
                summary: "Submit or cancel appointment booking request",
                description: "Books a new appointment slot, reschedules an existing one, or cancels an active booking if date/time are omitted.",
                parameters: [
                    {
                        in: "header",
                        name: "x-user-email",
                        required: true,
                        schema: { type: "string" },
                        example: "patient@careos.com",
                        description: "Email of the authenticated user"
                    }
                ],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["patientEmail"],
                                properties: {
                                    patientEmail: { type: "string", example: "patient@careos.com" },
                                    doctorEmail: { type: "string", example: "doctor@careos.com" },
                                    date: { type: "string", format: "date", example: "2026-08-01" },
                                    time: { type: "string", example: "10:00 AM" },
                                    symptoms: { type: "string", example: "Chest tightness and exertional dyspnea." },
                                    appointmentId: { type: "string", example: "66a8db123a167f0b6ee117c2", description: "Pass to reschedule or cancel" }
                                }
                            }
                        }
                    }
                },
                responses: {
                    201: {
                        description: "Appointment requested/created successfully.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        status: { type: "string", example: "success" },
                                        data: { type: "object" }
                                    }
                                }
                            }
                        }
                    },
                    400: { description: "Missing required fields or slot unavailable" },
                    409: { description: "Doctor or patient time slot collision" }
                }
            }
        },
        "/api/v1/doctors/profile": {
            get: {
                tags: ["Doctor Operations"],
                summary: "Get doctor profile data",
                description: "Retrieves identity and professional profile metadata for the doctor.",
                parameters: [
                    {
                        in: "query",
                        name: "email",
                        required: true,
                        schema: { type: "string" },
                        example: "doctor@careos.com"
                    }
                ],
                responses: {
                    200: {
                        description: "Doctor profile retrieved successfully.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        status: { type: "string", example: "success" },
                                        data: {
                                            type: "object",
                                            properties: {
                                                user: { type: "object" },
                                                profile: { type: "object" }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    400: { description: "Email identifier required" },
                    404: { description: "Doctor identity not found" }
                }
            },
            put: {
                tags: ["Doctor Operations"],
                summary: "Update doctor profile",
                description: "Updates professional information, fee, qualification, and contact info.",
                parameters: [
                    {
                        in: "query",
                        name: "email",
                        required: true,
                        schema: { type: "string" },
                        example: "doctor@careos.com"
                    }
                ],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["email", "specialization", "qualification", "experience_start_date", "clinic_address"],
                                properties: {
                                    email: { type: "string", example: "doctor@careos.com" },
                                    phone: { type: "string", example: "9876543210" },
                                    firstName: { type: "string", example: "Rohan" },
                                    lastName: { type: "string", example: "Joshi" },
                                    specialization: { type: "string", example: "Cardiology" },
                                    qualification: { type: "string", example: "MBBS, MD (Cardiology)" },
                                    experience_start_date: { type: "string", format: "date", example: "2015-01-01" },
                                    consultation_fee: { type: "number", example: 1200 },
                                    bio: { type: "string", example: "Senior Consultant Cardiologist." },
                                    clinic_address: { type: "string", example: "Wing A, CareOS Central Hospital" }
                                }
                            }
                        }
                    }
                },
                responses: {
                    200: {
                        description: "Profile metrics persistent and updated.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        status: { type: "string", example: "success" },
                                        message: { type: "string", example: "Profile metrics persistent." },
                                        data: { type: "object" }
                                    }
                                }
                            }
                        }
                    },
                    400: { description: "Missing required parameters" }
                }
            }
        },
        "/api/v1/doctors/availability": {
            get: {
                tags: ["Doctor Availability"],
                summary: "Fetch schedule matrix for a month",
                description: "Returns default weekly slots and custom day overrides for a doctor.",
                parameters: [
                    {
                        in: "query",
                        name: "email",
                        required: true,
                        schema: { type: "string" },
                        example: "doctor@careos.com"
                    },
                    {
                        in: "query",
                        name: "year",
                        required: true,
                        schema: { type: "integer" },
                        example: 2026
                    },
                    {
                        in: "query",
                        name: "month",
                        required: true,
                        schema: { type: "integer" },
                        example: 7
                    }
                ],
                responses: {
                    200: {
                        description: "Schedule matrix retrieved successfully.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        status: { type: "string", example: "success" },
                                        data: { type: "object" }
                                    }
                                }
                            }
                        }
                    },
                    400: { description: "Email, year, and month are required" }
                }
            }
        },
        "/api/v1/doctors/availability/override": {
            post: {
                tags: ["Doctor Availability"],
                summary: "Override availability slots for a single day",
                description: "Sets custom available slots for a specific date or resets to default if slots is null.",
                parameters: [
                    {
                        in: "query",
                        name: "email",
                        required: true,
                        schema: { type: "string" },
                        example: "doctor@careos.com"
                    }
                ],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["email", "date"],
                                properties: {
                                    email: { type: "string", example: "doctor@careos.com" },
                                    date: { type: "string", format: "date", example: "2026-08-01" },
                                    slots: {
                                        type: "array",
                                        items: { type: "string" },
                                        example: ["10:00 - 10:50", "11:00 - 11:50"],
                                        description: "Array of time slot strings, or null to revert to default"
                                    }
                                }
                            }
                        }
                    }
                },
                responses: {
                    200: {
                        description: "Single day availability override saved successfully.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        status: { type: "string", example: "success" },
                                        data: { type: "object" }
                                    }
                                }
                            }
                        }
                    },
                    403: { description: "Unauthorized to modify another doctor's availability" },
                    409: { description: "Cannot disable slot that has an active appointment" }
                }
            }
        },
        "/api/v1/doctors/appointments": {
            get: {
                tags: ["Doctor Availability"],
                summary: "Fetch appointment roster for doctor",
                description: "Retrieves pending and confirmed appointments for a specified month.",
                parameters: [
                    {
                        in: "query",
                        name: "email",
                        required: true,
                        schema: { type: "string" },
                        example: "doctor@careos.com"
                    },
                    {
                        in: "query",
                        name: "year",
                        required: true,
                        schema: { type: "integer" },
                        example: 2026
                    },
                    {
                        in: "query",
                        name: "month",
                        required: true,
                        schema: { type: "integer" },
                        example: 7
                    }
                ],
                responses: {
                    200: {
                        description: "Appointment roster retrieved successfully.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        status: { type: "string", example: "success" },
                                        data: {
                                            type: "object",
                                            properties: {
                                                pendingRequests: { type: "array", items: { type: "object" } },
                                                appointments: { type: "array", items: { type: "object" } }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    403: { description: "Unauthorized view attempt" }
                }
            }
        },
        "/api/v1/doctors/appointments/{appointmentId}/status": {
            patch: {
                tags: ["Doctor Availability"],
                summary: "Accept or reject appointment request",
                description: "Updates pending appointment status to confirmed or rejected.",
                parameters: [
                    {
                        in: "query",
                        name: "email",
                        required: true,
                        schema: { type: "string" },
                        example: "doctor@careos.com"
                    },
                    {
                        in: "path",
                        name: "appointmentId",
                        required: true,
                        schema: { type: "string" },
                        example: "66a8db123a167f0b6ee117c2"
                    }
                ],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["email", "status"],
                                properties: {
                                    email: { type: "string", example: "doctor@careos.com" },
                                    status: { type: "string", enum: ["confirmed", "rejected"], example: "confirmed" }
                                }
                            }
                        }
                    }
                },
                responses: {
                    200: {
                        description: "Appointment status updated.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        status: { type: "string", example: "success" },
                                        data: { type: "object" }
                                    }
                                }
                            }
                        }
                    },
                    409: { description: "Slot occupied by another confirmed appointment" }
                }
            }
        },
        "/api/v1/doctors/lab-reviews": {
            get: {
                tags: ["Doctor Operations"],
                summary: "Fetch lab report reviews for doctor's patients",
                description: "Retrieves diagnostic lab histories linked to doctor's appointments.",
                parameters: [
                    {
                        in: "header",
                        name: "x-doctor-email",
                        required: false,
                        schema: { type: "string" },
                        example: "doctor@careos.com"
                    },
                    {
                        in: "query",
                        name: "email",
                        required: false,
                        schema: { type: "string" },
                        example: "doctor@careos.com"
                    }
                ],
                responses: {
                    200: {
                        description: "Lab reviews ledger retrieved.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        status: { type: "string", example: "success" },
                                        data: { type: "array", items: { type: "object" } }
                                    }
                                }
                            }
                        }
                    },
                    401: { description: "Doctor authorization context missing" }
                }
            }
        },
        "/api/v1/doctors/patients": {
            get: {
                tags: ["Doctor Operations"],
                summary: "Fetch doctor patient roster",
                description: "Retrieves list of patients who have consulted with the doctor.",
                parameters: [
                    {
                        in: "query",
                        name: "doctorEmail",
                        required: true,
                        schema: { type: "string" },
                        example: "doctor@careos.com"
                    }
                ],
                responses: {
                    200: {
                        description: "Patient roster fetched successfully.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        status: { type: "string", example: "success" },
                                        data: { type: "array", items: { type: "object" } }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        "/api/v1/doctors/patients/history": {
            get: {
                tags: ["Doctor Operations"],
                summary: "Fetch patient medical history for doctor",
                description: "Retrieves timeline of appointments and prescriptions for a specific patient under this doctor.",
                parameters: [
                    {
                        in: "query",
                        name: "doctorEmail",
                        required: true,
                        schema: { type: "string" },
                        example: "doctor@careos.com"
                    },
                    {
                        in: "query",
                        name: "patientEmail",
                        required: true,
                        schema: { type: "string" },
                        example: "patient@careos.com"
                    }
                ],
                responses: {
                    200: {
                        description: "Patient medical timeline retrieved successfully.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        status: { type: "string", example: "success" },
                                        data: { type: "object" }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        "/api/v1/doctors/catalogs": {
            get: {
                tags: ["Doctor Operations"],
                summary: "Fetch medicine and lab catalogs by specialization",
                description: "Returns dropdown options for medicines and lab tests filtered by doctor's specialization.",
                parameters: [
                    {
                        in: "query",
                        name: "specialization",
                        required: true,
                        schema: { type: "string" },
                        example: "Cardiology"
                    },
                    {
                        in: "query",
                        name: "email",
                        required: true,
                        schema: { type: "string" },
                        example: "doctor@careos.com"
                    }
                ],
                responses: {
                    200: {
                        description: "Catalog records fetched successfully.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        status: { type: "string", example: "success" },
                                        data: {
                                            type: "object",
                                            properties: {
                                                medicines: { type: "array", items: { type: "object" } },
                                                labReports: { type: "array", items: { type: "object" } }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        "/api/v1/doctors/e-prescription": {
            post: {
                tags: ["Doctor Operations"],
                summary: "Create an e-prescription",
                description: "Generates a new digital prescription for an appointment and syncs billing draft.",
                parameters: [
                    {
                        in: "query",
                        name: "email",
                        required: true,
                        schema: { type: "string" },
                        example: "doctor@careos.com"
                    }
                ],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["appointmentId", "patientEmail", "doctorEmail", "result"],
                                properties: {
                                    appointmentId: { type: "string", example: "66a8db123a167f0b6ee117c2" },
                                    patientEmail: { type: "string", example: "patient@careos.com" },
                                    doctorEmail: { type: "string", example: "doctor@careos.com" },
                                    prescriptionName: { type: "string", example: "Hypertension Care Protocol" },
                                    diagnosis: { type: "string", example: "Essential Hypertension" },
                                    result: { type: "string", example: "Initiated daily antihypertensive regimen." },
                                    notes: { type: "string", example: "Low sodium diet, repeat BP check in 2 weeks." },
                                    medicines: {
                                        type: "array",
                                        items: {
                                            type: "object",
                                            properties: {
                                                medicine: { type: "string", example: "Amlodipine 5mg" },
                                                dosage: { type: "string", example: "1 tablet daily after breakfast" },
                                                days: { type: "number", example: 30 }
                                            }
                                        }
                                    },
                                    labReports: {
                                        type: "array",
                                        items: { type: "string" },
                                        example: ["Lipid Profile", "Serum Creatinine"]
                                    }
                                }
                            }
                        }
                    }
                },
                responses: {
                    201: {
                        description: "Prescription created and billing synced.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        status: { type: "string", example: "success" },
                                        data: { type: "object" }
                                    }
                                }
                            }
                        }
                    },
                    409: { description: "Prescription already exists for this appointment" }
                }
            }
        },
        "/api/v1/doctors/e-prescription/{prescriptionId}": {
            patch: {
                tags: ["Doctor Operations"],
                summary: "Update an e-prescription",
                description: "Modifies diagnosis, notes, medications, or lab tests in an existing prescription.",
                parameters: [
                    {
                        in: "path",
                        name: "prescriptionId",
                        required: true,
                        schema: { type: "string" },
                        example: "66a8db123a167f0b6ee117c2"
                    },
                    {
                        in: "query",
                        name: "email",
                        required: true,
                        schema: { type: "string" },
                        example: "doctor@careos.com"
                    }
                ],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    doctorEmail: { type: "string", example: "doctor@careos.com" },
                                    prescriptionName: { type: "string", example: "Updated Hypertension Protocol" },
                                    diagnosis: { type: "string", example: "Stage 1 Primary Hypertension" },
                                    result: { type: "string", example: "Adjusted dosage parameters." },
                                    medicines: { type: "array", items: { type: "object" } },
                                    labReports: { type: "array", items: { type: "string" } }
                                }
                            }
                        }
                    }
                },
                responses: {
                    200: {
                        description: "Prescription updated successfully.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        status: { type: "string", example: "success" },
                                        data: { type: "object" }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            delete: {
                tags: ["Doctor Operations"],
                summary: "Delete an e-prescription",
                description: "Removes a prescription record and voids associated pending pharmacy/lab orders.",
                parameters: [
                    {
                        in: "path",
                        name: "prescriptionId",
                        required: true,
                        schema: { type: "string" },
                        example: "66a8db123a167f0b6ee117c2"
                    },
                    {
                        in: "query",
                        name: "doctorEmail",
                        required: true,
                        schema: { type: "string" },
                        example: "doctor@careos.com"
                    }
                ],
                responses: {
                    200: {
                        description: "Prescription deleted.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        status: { type: "string", example: "success" },
                                        data: {
                                            type: "object",
                                            properties: {
                                                deleted: { type: "boolean", example: true },
                                                prescriptionId: { type: "string", example: "66a8db123a167f0b6ee117c2" }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        "/api/v1/doctors/inpatient/treatment-queue": {
            get: {
                tags: ["Inpatient Treatment"],
                summary: "Get active admitted patients for doctor",
                description: "Lists active inpatient admissions linked to prescriptions issued by this doctor.",
                parameters: [
                    {
                        in: "header",
                        name: "x-doctor-email",
                        required: false,
                        schema: { type: "string" },
                        example: "doctor@careos.com"
                    },
                    {
                        in: "query",
                        name: "email",
                        required: false,
                        schema: { type: "string" },
                        example: "doctor@careos.com"
                    }
                ],
                responses: {
                    200: {
                        description: "Inpatient queue fetched successfully.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        status: { type: "string", example: "success" },
                                        count: { type: "number", example: 1 },
                                        data: { type: "array", items: { type: "object" } }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        "/api/v1/doctors/inpatient/treatment-plan": {
            post: {
                tags: ["Inpatient Treatment"],
                summary: "Submit new inpatient treatment plan order",
                description: "Orders nursing treatment plan items (injections, fluids, monitoring) for an admitted patient.",
                parameters: [
                    {
                        in: "query",
                        name: "email",
                        required: true,
                        schema: { type: "string" },
                        example: "doctor@careos.com"
                    }
                ],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["admissionId", "treatmentHeading", "items", "scheduledDate", "scheduledTime"],
                                properties: {
                                    doctorEmail: { type: "string", example: "doctor@careos.com" },
                                    admissionId: { type: "string", example: "66a8db123a167f0b6ee117c2" },
                                    treatmentHeading: { type: "string", example: "Post-op Cardiac Monitoring & Fluid Support" },
                                    scheduledDate: { type: "string", format: "date", example: "2026-07-30" },
                                    scheduledTime: { type: "string", example: "08:00 AM" },
                                    clinicalNotes: { type: "string", example: "Monitor vitals every 2 hours." },
                                    items: {
                                        type: "array",
                                        items: {
                                            type: "object",
                                            required: ["itemType", "itemName", "dosageConfiguration", "unitPrice", "quantity"],
                                            properties: {
                                                itemType: { type: "string", enum: ["Injection", "Dosage", "Instrument", "Fluid/Glucose", "Other"], example: "Fluid/Glucose" },
                                                itemName: { type: "string", example: "Ringer Lactate 500ml" },
                                                dosageConfiguration: { type: "string", example: "IV @ 80 ml/hr" },
                                                unitPrice: { type: "number", example: 180 },
                                                quantity: { type: "number", example: 2 }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                responses: {
                    201: {
                        description: "Treatment plan order created successfully.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        status: { type: "string", example: "success" },
                                        data: { type: "object" }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        "/api/v1/doctors/inpatient/treatment-plan/{planId}": {
            put: {
                tags: ["Inpatient Treatment"],
                summary: "Update an inpatient treatment plan order",
                description: "Updates a pending treatment plan prior to administration by ward nurses.",
                parameters: [
                    {
                        in: "path",
                        name: "planId",
                        required: true,
                        schema: { type: "string" },
                        example: "66a8db123a167f0b6ee117c2"
                    },
                    {
                        in: "query",
                        name: "email",
                        required: true,
                        schema: { type: "string" },
                        example: "doctor@careos.com"
                    }
                ],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["treatmentHeading", "items", "scheduledDate", "scheduledTime"],
                                properties: {
                                    doctorEmail: { type: "string", example: "doctor@careos.com" },
                                    treatmentHeading: { type: "string", example: "Updated Post-op Treatment Order" },
                                    scheduledDate: { type: "string", format: "date", example: "2026-07-30" },
                                    scheduledTime: { type: "string", example: "09:00 AM" },
                                    clinicalNotes: { type: "string", example: "Adjusted IV drip rate." },
                                    items: { type: "array", items: { type: "object" } }
                                }
                            }
                        }
                    }
                },
                responses: {
                    200: {
                        description: "Treatment plan order modified successfully.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        status: { type: "string", example: "success" },
                                        data: { type: "object" }
                                    }
                                }
                            }
                        }
                    },
                    400: { description: "Cannot modify plan that has already been administered or cancelled" }
                }
            }
        },
        "/api/v1/receptionist/metrics": {
            get: {
                tags: ["Receptionist Operations"],
                summary: "Fetch receptionist system dashboard metrics",
                description: "Retrieves count indicators for upcoming confirmed, awaiting signoff, concluded visited, and declined/cancelled appointments.",
                parameters: [
                    {
                        in: "header",
                        name: "x-user-email",
                        required: true,
                        schema: { type: "string" },
                        example: "receptionist@careos.com"
                    }
                ],
                responses: {
                    200: {
                        description: "Dashboard metrics compiled successfully.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        status: { type: "string", example: "success" },
                                        data: {
                                            type: "object",
                                            properties: {
                                                upcomingConfirmed: { type: "number", example: 12 },
                                                awaitingSignoff: { type: "number", example: 4 },
                                                concludedVisited: { type: "number", example: 48 },
                                                declinedCancelled: { type: "number", example: 3 }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    401: { description: "Unauthorized session context" }
                }
            }
        },
        "/api/v1/receptionist/appointments": {
            get: {
                tags: ["Receptionist Operations"],
                summary: "Fetch all system appointments for receptionist desk",
                description: "Lists all scheduled appointments with optional status filtering ('confirmed', 'pending', 'concluded', 'declined') and search capability.",
                parameters: [
                    {
                        in: "header",
                        name: "x-user-email",
                        required: true,
                        schema: { type: "string" },
                        example: "receptionist@careos.com"
                    },
                    {
                        in: "query",
                        name: "status",
                        required: false,
                        schema: { type: "string", enum: ["confirmed", "pending", "concluded", "declined"] },
                        example: "confirmed"
                    },
                    {
                        in: "query",
                        name: "search",
                        required: false,
                        schema: { type: "string" },
                        example: "Rajesh"
                    }
                ],
                responses: {
                    200: {
                        description: "Appointments overview list fetched successfully.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        status: { type: "string", example: "success" },
                                        count: { type: "number", example: 5 },
                                        data: { type: "array", items: { type: "object" } }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        "/api/v1/receptionist/receptionist-book-request": {
            post: {
                tags: ["Receptionist Operations"],
                summary: "Book or reschedule walk-in patient appointment",
                description: "Creates a confirmed walk-in appointment or reschedules an existing one at the reception desk.",
                parameters: [
                    {
                        in: "header",
                        name: "x-user-email",
                        required: true,
                        schema: { type: "string" },
                        example: "receptionist@careos.com"
                    }
                ],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["firstName", "patientEmail", "doctorEmail", "date", "time", "symptoms"],
                                properties: {
                                    firstName: { type: "string", example: "Rajesh" },
                                    lastName: { type: "string", example: "Sharma" },
                                    patientEmail: { type: "string", example: "patient@careos.com" },
                                    doctorEmail: { type: "string", example: "doctor@careos.com" },
                                    date: { type: "string", format: "date", example: "2026-08-02" },
                                    time: { type: "string", example: "11:00 AM" },
                                    symptoms: { type: "string", example: "Acute abdominal distress" },
                                    appointmentId: { type: "string", example: "66a8db123a167f0b6ee117c2", description: "Pass to reschedule existing appointment" }
                                }
                            }
                        }
                    }
                },
                responses: {
                    201: {
                        description: "Walk-in appointment recorded and confirmed.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        status: { type: "string", example: "success" },
                                        data: { type: "object" }
                                    }
                                }
                            }
                        }
                    },
                    409: { description: "Time slot collision for this practitioner" }
                }
            }
        },
        "/api/v1/receptionist/appointments/{appointmentId}/action": {
            patch: {
                tags: ["Receptionist Operations"],
                summary: "Process action on appointment (confirm, reject, cancel)",
                description: "Updates an appointment status via administrative action.",
                parameters: [
                    {
                        in: "path",
                        name: "appointmentId",
                        required: true,
                        schema: { type: "string" },
                        example: "66a8db123a167f0b6ee117c2"
                    },
                    {
                        in: "header",
                        name: "x-user-email",
                        required: true,
                        schema: { type: "string" },
                        example: "receptionist@careos.com"
                    }
                ],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["action"],
                                properties: {
                                    action: { type: "string", enum: ["confirm", "reject", "cancel"], example: "confirm" }
                                }
                            }
                        }
                    }
                },
                responses: {
                    200: {
                        description: "Appointment action processed successfully.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        status: { type: "string", example: "success" },
                                        message: { type: "string", example: "Appointment successfully confirmed." },
                                        data: { type: "object" }
                                    }
                                }
                            }
                        }
                    },
                    400: { description: "Invalid action or session already cancelled" }
                }
            }
        },
        "/api/v1/receptionist/admission/dashboard": {
            get: {
                tags: ["Inpatient Admissions"],
                summary: "Fetch inpatient admission dashboard data",
                description: "Retrieves bed availability, incoming admission prescription queue, active admissions, and available ward nurses.",
                parameters: [
                    {
                        in: "header",
                        name: "x-user-email",
                        required: true,
                        schema: { type: "string" },
                        example: "receptionist@careos.com"
                    }
                ],
                responses: {
                    200: {
                        description: "Admission dashboard datasets loaded successfully.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        status: { type: "string", example: "success" },
                                        data: {
                                            type: "object",
                                            properties: {
                                                beds: { type: "array", items: { type: "object" } },
                                                incomingQueue: { type: "array", items: { type: "object" } },
                                                currentAdmissions: { type: "array", items: { type: "object" } },
                                                nurses: { type: "array", items: { type: "object" } }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        "/api/v1/receptionist/admission/check-in": {
            post: {
                tags: ["Inpatient Admissions"],
                summary: "Check-in patient for inpatient admission",
                description: "Locks a vacant bed, assigns 1 to 3 nurses, and initializes an active admission record.",
                parameters: [
                    {
                        in: "header",
                        name: "x-user-email",
                        required: true,
                        schema: { type: "string" },
                        example: "receptionist@careos.com"
                    }
                ],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["prescriptionId", "patientName", "patientEmail", "roomType", "nurseIds"],
                                properties: {
                                    prescriptionId: { type: "string", example: "66a8db123a167f0b6ee117c2" },
                                    patientId: { type: "string", example: "66a8db123a167f0b6ee117c1" },
                                    patientName: { type: "string", example: "Rajesh Sharma" },
                                    patientEmail: { type: "string", example: "patient@careos.com" },
                                    roomType: { type: "string", enum: ["General Room", "Semi-Deluxe Room", "Deluxe Room", "ICU"], example: "Deluxe Room" },
                                    nurseIds: {
                                        type: "array",
                                        items: { type: "string" },
                                        example: ["66a8db123a167f0b6ee117c3"],
                                        description: "Between 1 and 3 nurse ObjectId strings"
                                    }
                                }
                            }
                        }
                    }
                },
                responses: {
                    201: {
                        description: "Patient admitted and bed locked.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        status: { type: "string", example: "success" },
                                        message: { type: "string", example: "Patient admitted and bed locked." },
                                        data: { type: "object" }
                                    }
                                }
                            }
                        }
                    },
                    400: { description: "Invalid nurse count or missing parameters" },
                    422: { description: "No vacant beds available under chosen room type" }
                }
            }
        },
        "/api/v1/receptionist/admission/{admissionId}/discharge": {
            patch: {
                tags: ["Inpatient Admissions"],
                summary: "Process discharge checkout for admitted patient",
                description: "Marks admission status as Discharged and releases locked bed back to Available.",
                parameters: [
                    {
                        in: "path",
                        name: "admissionId",
                        required: true,
                        schema: { type: "string" },
                        example: "66a8db123a167f0b6ee117c2"
                    },
                    {
                        in: "header",
                        name: "x-user-email",
                        required: true,
                        schema: { type: "string" },
                        example: "receptionist@careos.com"
                    }
                ],
                responses: {
                    200: {
                        description: "Discharge workflow completed safely.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        status: { type: "string", example: "success" },
                                        message: { type: "string", example: "Discharge workflow logged safely." },
                                        data: { type: "object" }
                                    }
                                }
                            }
                        }
                    },
                    404: { description: "Active admission profile not found or already discharged" }
                }
            }
        },
        "/api/v1/receptionist/visited-appointments": {
            get: {
                tags: ["Revenue & Billing Operations"],
                summary: "Fetch visited completed appointments queue for billing",
                description: "Lists unbilled completed appointments requiring financial aggregation and invoice drafting.",
                parameters: [
                    {
                        in: "header",
                        name: "x-user-email",
                        required: true,
                        schema: { type: "string" },
                        example: "receptionist@careos.com"
                    }
                ],
                responses: {
                    200: {
                        description: "Visited queue retrieved.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        status: { type: "string", example: "success" },
                                        data: { type: "array", items: { type: "object" } }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        "/api/v1/receptionist/draft-invoice/{appointmentId}": {
            get: {
                tags: ["Revenue & Billing Operations"],
                summary: "Aggregate cost breakdown and build draft invoice",
                description: "Aggregates consultation fee, administered treatment plans, pharmacy orders, lab reports, and insurance details for an appointment.",
                parameters: [
                    {
                        in: "path",
                        name: "appointmentId",
                        required: true,
                        schema: { type: "string" },
                        example: "66a8db123a167f0b6ee117c2"
                    },
                    {
                        in: "header",
                        name: "x-user-email",
                        required: true,
                        schema: { type: "string" },
                        example: "receptionist@careos.com"
                    }
                ],
                responses: {
                    200: {
                        description: "Invoice draft aggregated successfully.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        status: { type: "string", example: "success" },
                                        data: { type: "object" }
                                    }
                                }
                            }
                        }
                    },
                    400: { description: "Appointment reference missing or invalid" }
                }
            }
        },
        "/api/v1/receptionist/finalize-invoice": {
            post: {
                tags: ["Revenue & Billing Operations"],
                summary: "Finalize and commit invoice record",
                description: "Saves a confirmed ledger bill with optional extra charges, insurance validation, and payment method.",
                parameters: [
                    {
                        in: "header",
                        name: "x-user-email",
                        required: true,
                        schema: { type: "string" },
                        example: "receptionist@careos.com"
                    }
                ],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["appointmentId", "patientId", "doctorId"],
                                properties: {
                                    appointmentId: { type: "string", example: "66a8db123a167f0b6ee117c2" },
                                    patientId: { type: "string", example: "66a8db123a167f0b6ee117c1" },
                                    doctorId: { type: "string", example: "66a8db123a167f0b6ee117c0" },
                                    patientEmail: { type: "string", example: "patient@careos.com" },
                                    extraCharges: { type: "number", example: 250 },
                                    extraChargesNotes: { type: "string", example: "Specialist expedited processing fee." },
                                    insurance: {
                                        type: "object",
                                        properties: {
                                            provider: { type: "string", example: "CareHealth Shield" },
                                            policyNumber: { type: "string", example: "POL998877" },
                                            isValidated: { type: "boolean", example: false }
                                        }
                                    },
                                    paymentMethod: { type: "string", enum: ["Cash", "Card", "UPI", "Insurance", "Mixed"], example: "Cash" },
                                    receptionistEmail: { type: "string", example: "receptionist@careos.com" }
                                }
                            }
                        }
                    }
                },
                responses: {
                    201: {
                        description: "Final invoice signed and committed successfully.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        status: { type: "string", example: "success" },
                                        data: { type: "object" }
                                    }
                                }
                            }
                        }
                    },
                    401: { description: "Receptionist session verification required" }
                }
            }
        },
        "/api/v1/receptionist/billing-history-partition": {
            get: {
                tags: ["Revenue & Billing Operations"],
                summary: "Fetch partitioned master billing history",
                description: "Retrieves all billing records partitioned into unpaid, insurancePending, paid, and cancelled categories.",
                parameters: [
                    {
                        in: "header",
                        name: "x-user-email",
                        required: true,
                        schema: { type: "string" },
                        example: "receptionist@careos.com"
                    }
                ],
                responses: {
                    200: {
                        description: "Master billing history partitions retrieved successfully.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        status: { type: "string", example: "success" },
                                        data: {
                                            type: "object",
                                            properties: {
                                                unpaid: { type: "array", items: { type: "object" } },
                                                insurancePending: { type: "array", items: { type: "object" } },
                                                paid: { type: "array", items: { type: "object" } },
                                                cancelled: { type: "array", items: { type: "object" } }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        "/api/v1/receptionist/invoice/{invoiceId}/status": {
            patch: {
                tags: ["Revenue & Billing Operations"],
                summary: "Update invoice status state",
                description: "Modifies invoice payment status (e.g. mark Paid, Insurance_Claim_Pending, or Cancelled) and updates payment method.",
                parameters: [
                    {
                        in: "path",
                        name: "invoiceId",
                        required: true,
                        schema: { type: "string" },
                        example: "66a8db123a167f0b6ee117c2"
                    },
                    {
                        in: "header",
                        name: "x-user-email",
                        required: true,
                        schema: { type: "string" },
                        example: "receptionist@careos.com"
                    }
                ],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["status"],
                                properties: {
                                    status: { type: "string", enum: ["Unpaid", "Partially_Paid", "Paid", "Insurance_Claim_Pending", "Cancelled"], example: "Paid" },
                                    paymentMethod: { type: "string", enum: ["Cash", "Card", "UPI", "Insurance", "Mixed"], example: "Cash" }
                                }
                            }
                        }
                    }
                },
                responses: {
                    200: {
                        description: "Invoice status state updated.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        status: { type: "string", example: "success" },
                                        data: { type: "object" }
                                    }
                                }
                            }
                        }
                    },
                    400: { description: "Invalid status parameter or reference" }
                }
            }
        },
        "/api/v1/nurse/my-admissions": {
            get: {
                tags: ["Nurse Ward Operations"],
                summary: "Fetch active admissions assigned to nurse",
                description: "Retrieves all currently admitted patients assigned to the authenticated nurse along with room/bed details, prescription context, and vitals history.",
                parameters: [
                    {
                        in: "header",
                        name: "x-user-email",
                        required: true,
                        schema: { type: "string" },
                        example: "nurse@careos.com",
                        description: "Email of the authenticated nurse"
                    }
                ],
                responses: {
                    200: {
                        description: "Nurse active admissions list retrieved successfully.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        success: { type: "boolean", example: true },
                                        data: {
                                            type: "array",
                                            items: {
                                                type: "object",
                                                properties: {
                                                    _id: { type: "string", example: "66a8db123a167f0b6ee117c2" },
                                                    patientName: { type: "string", example: "Rajesh Sharma" },
                                                    patientEmail: { type: "string", example: "patient@careos.com" },
                                                    roomType: { type: "string", example: "Deluxe Room" },
                                                    status: { type: "string", example: "Admitted" },
                                                    admittedAt: { type: "string", format: "date-time" },
                                                    dischargeEligibleAt: { type: "string", format: "date-time" },
                                                    vitalsHistory: { type: "array", items: { type: "object" } },
                                                    prescriptionId: { type: "object" },
                                                    bedId: { type: "object" }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    400: { description: "Nurse processing identification context missing" },
                    404: { description: "Nurse profile details missing" }
                }
            }
        },
        "/api/v1/nurse/{admissionId}/ready-discharge": {
            patch: {
                tags: ["Nurse Ward Operations"],
                summary: "Mark patient ready for discharge",
                description: "Updates the discharge eligibility timestamp on an active inpatient admission record.",
                parameters: [
                    {
                        in: "path",
                        name: "admissionId",
                        required: true,
                        schema: { type: "string" },
                        example: "66a8db123a167f0b6ee117c2",
                        description: "MongoDB ObjectId of the active admission"
                    },
                    {
                        in: "header",
                        name: "x-user-email",
                        required: true,
                        schema: { type: "string" },
                        example: "nurse@careos.com"
                    }
                ],
                responses: {
                    200: {
                        description: "Patient discharge eligibility timestamp updated.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        success: { type: "boolean", example: true },
                                        message: { type: "string", example: "Patient profile discharge eligibility timestamp updated." },
                                        data: { type: "object" }
                                    }
                                }
                            }
                        }
                    },
                    400: { description: "Invalid reference key or already discharged" },
                    404: { description: "Target admission record missing" }
                }
            }
        },
        "/api/v1/nurse/{admissionId}/complete-discharge": {
            patch: {
                tags: ["Nurse Ward Operations"],
                summary: "Execute final discharge checkout by nurse",
                description: "Concludes the admission cycle, changes status to Discharged, and frees up the assigned ward bed.",
                parameters: [
                    {
                        in: "path",
                        name: "admissionId",
                        required: true,
                        schema: { type: "string" },
                        example: "66a8db123a167f0b6ee117c2"
                    },
                    {
                        in: "header",
                        name: "x-user-email",
                        required: true,
                        schema: { type: "string" },
                        example: "nurse@careos.com"
                    }
                ],
                responses: {
                    200: {
                        description: "Patient discharged and ward bed released.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        success: { type: "boolean", example: true },
                                        message: { type: "string", example: "Patient completely discharged. Corresponding ward unit space state is now set to Available." },
                                        data: { type: "object" }
                                    }
                                }
                            }
                        }
                    },
                    400: { description: "Admission already officially discharged" },
                    404: { description: "Admission tracking profile missing" }
                }
            }
        },
        "/api/v1/nurse/{admissionId}/vitals": {
            post: {
                tags: ["Nurse Ward Operations"],
                summary: "Record patient physiological vitals",
                description: "Appends a new set of vitals (Blood Pressure, Heart Rate, Temperature) to the patient's admission vitals history.",
                parameters: [
                    {
                        in: "path",
                        name: "admissionId",
                        required: true,
                        schema: { type: "string" },
                        example: "66a8db123a167f0b6ee117c2"
                    },
                    {
                        in: "header",
                        name: "x-user-email",
                        required: true,
                        schema: { type: "string" },
                        example: "nurse@careos.com"
                    }
                ],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["bloodPressure", "heartRate", "temperature"],
                                properties: {
                                    bloodPressure: { type: "string", example: "120/80" },
                                    heartRate: { type: "number", example: 74 },
                                    temperature: { type: "number", example: 98.6 }
                                }
                            }
                        }
                    }
                },
                responses: {
                    200: {
                        description: "Vitals log recorded successfully.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        success: { type: "boolean", example: true },
                                        message: { type: "string", example: "Patient clinical vitals matrices track logged successfully." },
                                        data: { type: "object" }
                                    }
                                }
                            }
                        }
                    },
                    400: { description: "Missing required vitals parameters or invalid formatting" },
                    404: { description: "Target admission file details missing" }
                }
            }
        },
        "/api/v1/nurse/lab-reviews": {
            get: {
                tags: ["Nurse Lab Operations"],
                summary: "Fetch lab report reviews for nurse's ward patients",
                description: "Retrieves diagnostic lab report histories associated with patients currently admitted under the nurse's care.",
                parameters: [
                    {
                        in: "header",
                        name: "x-user-email",
                        required: false,
                        schema: { type: "string" },
                        example: "nurse@careos.com"
                    },
                    {
                        in: "query",
                        name: "email",
                        required: false,
                        schema: { type: "string" },
                        example: "nurse@careos.com"
                    }
                ],
                responses: {
                    200: {
                        description: "Nurse lab report reviews ledger retrieved successfully.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        status: { type: "string", example: "success" },
                                        data: { type: "array", items: { type: "object" } }
                                    }
                                }
                            }
                        }
                    },
                    401: { description: "Nurse authorization context could not be verified" },
                    404: { description: "No active nurse account registration found" }
                }
            }
        },
        "/api/v1/nurse/inpatient-queue": {
            get: {
                tags: ["Nurse Inpatient Administration"],
                summary: "Get inpatient treatment queue for assigned nurse",
                description: "Retrieves active admitted patients assigned to the nurse along with their existing treatment plans.",
                parameters: [
                    {
                        in: "header",
                        name: "x-user-email",
                        required: false,
                        schema: { type: "string" },
                        example: "nurse@careos.com"
                    }
                ],
                responses: {
                    200: {
                        description: "Assigned inpatient queue retrieved successfully.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        status: { type: "string", example: "success" },
                                        count: { type: "number", example: 2 },
                                        data: { type: "array", items: { type: "object" } }
                                    }
                                }
                            }
                        }
                    },
                    401: { description: "Nurse identification session context missing" }
                }
            }
        },
        "/api/v1/nurse/treatment-plan/{planId}/administer": {
            patch: {
                tags: ["Nurse Inpatient Administration"],
                summary: "Sign off / administer an inpatient treatment plan",
                description: "Marks a pending treatment plan order as Administered and logs the executing nurse ID and timestamp.",
                parameters: [
                    {
                        in: "path",
                        name: "planId",
                        required: true,
                        schema: { type: "string" },
                        example: "66a8db123a167f0b6ee117c2",
                        description: "ObjectId of the Treatment Plan"
                    },
                    {
                        in: "header",
                        name: "x-user-email",
                        required: false,
                        schema: { type: "string" },
                        example: "nurse@careos.com"
                    }
                ],
                responses: {
                    200: {
                        description: "Treatment plan administered and signed off successfully.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        status: { type: "string", example: "success" },
                                        data: {
                                            type: "object",
                                            properties: {
                                                _id: { type: "string", example: "66a8db123a167f0b6ee117c2" },
                                                administrationStatus: { type: "string", example: "Administered" },
                                                administeredByNurseId: { type: "string", example: "66a8db123a167f0b6ee117c0" },
                                                administeredAt: { type: "string", format: "date-time" }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    400: { description: "Invalid Plan ID format or directive already administered" },
                    403: { description: "Nurse identification credentials not located" },
                    404: { description: "Target treatment tracking record missing" }
                }
            }
        },
        "/api/v1/nurse/catalogs": {
            get: {
                tags: ["Nurse Prescription Services"],
                summary: "Fetch medicine and lab catalogs by specialization",
                description: "Returns catalog options for medicines and lab tests filtered by specialization.",
                parameters: [
                    {
                        in: "query",
                        name: "specialization",
                        required: true,
                        schema: { type: "string" },
                        example: "Cardiology"
                    },
                    {
                        in: "header",
                        name: "x-user-email",
                        required: true,
                        schema: { type: "string" },
                        example: "nurse@careos.com",
                        description: "Email of the authenticated nurse"
                    }
                ],
                responses: {
                    200: {
                        description: "Catalog data retrieved successfully.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        status: { type: "string", example: "success" },
                                        data: { type: "object" }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        "/api/v1/nurse/e-prescription": {
            post: {
                tags: ["Nurse Prescription Services"],
                summary: "Create an e-prescription by nurse",
                description: "Generates a new electronic prescription record for a ward or assigned patient.",
                parameters: [
                    {
                        in: "header",
                        name: "x-user-email",
                        required: true,
                        schema: { type: "string" },
                        example: "nurse@careos.com",
                        description: "Email of the authenticated nurse"
                    }
                ],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["patientEmail", "result"],
                                properties: {
                                    appointmentId: { type: "string", example: "66a8db123a167f0b6ee117c2" },
                                    patientEmail: { type: "string", example: "patient@careos.com" },
                                    prescriptionName: { type: "string", example: "Inpatient Supportive Care" },
                                    diagnosis: { type: "string", example: "Post-Operative Recovery" },
                                    notes: { type: "string", example: "Administer prescribed analgesics as required." },
                                    result: { type: "string", example: "Symptomatic relief observed." },
                                    medicines: { type: "array", items: { type: "object" } },
                                    labReports: { type: "array", items: { type: "string" } }
                                }
                            }
                        }
                    }
                },
                responses: {
                    201: {
                        description: "E-Prescription created successfully.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        status: { type: "string", example: "success" },
                                        data: { type: "object" }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        "/api/v1/nurse/patients": {
            get: {
                tags: ["Nurse Prescription Services"],
                summary: "Fetch nurse patient roster",
                description: "Retrieves list of active ward patients assigned to the nurse.",
                parameters: [
                    {
                        in: "header",
                        name: "x-user-email",
                        required: false,
                        schema: { type: "string" },
                        example: "nurse@careos.com"
                    },
                    {
                        in: "query",
                        name: "nurseEmail",
                        required: false,
                        schema: { type: "string" },
                        example: "nurse@careos.com"
                    }
                ],
                responses: {
                    200: {
                        description: "Nurse patient roster fetched successfully.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        status: { type: "string", example: "success" },
                                        data: { type: "array", items: { type: "object" } }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        "/api/v1/nurse/patients/history": {
            get: {
                tags: ["Nurse Prescription Services"],
                summary: "Fetch patient medical history for nurse",
                description: "Retrieves clinical timeline and prescriptions for an assigned ward patient.",
                parameters: [
                    {
                        in: "query",
                        name: "patientEmail",
                        required: true,
                        schema: { type: "string" },
                        example: "patient@careos.com"
                    },
                    {
                        in: "header",
                        name: "x-user-email",
                        required: false,
                        schema: { type: "string" },
                        example: "nurse@careos.com"
                    }
                ],
                responses: {
                    200: {
                        description: "Patient history fetched successfully.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        status: { type: "string", example: "success" },
                                        data: { type: "object" }
                                    }
                                }
                            }
                        }
                    },
                    403: { description: "Access denied or no active assignments for this patient" }
                }
            }
        },
        "/api/v1/nurse/e-prescription/{prescriptionId}": {
            patch: {
                tags: ["Nurse Prescription Services"],
                summary: "Update an e-prescription by nurse",
                description: "Updates prescription parameters for an assigned ward patient.",
                parameters: [
                    {
                        in: "path",
                        name: "prescriptionId",
                        required: true,
                        schema: { type: "string" },
                        example: "66a8db123a167f0b6ee117c2"
                    },
                    {
                        in: "header",
                        name: "x-user-email",
                        required: true,
                        schema: { type: "string" },
                        example: "nurse@careos.com",
                        description: "Email of the authenticated nurse"
                    }
                ],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    prescriptionName: { type: "string", example: "Updated Supportive Care" },
                                    diagnosis: { type: "string", example: "Post-Op Recovery Stage 2" },
                                    result: { type: "string", example: "Patient stable." },
                                    medicines: { type: "array", items: { type: "object" } },
                                    labReports: { type: "array", items: { type: "string" } }
                                }
                            }
                        }
                    }
                },
                responses: {
                    200: {
                        description: "Prescription updated successfully.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        status: { type: "string", example: "success" },
                                        data: { type: "object" }
                                    }
                                }
                            }
                        }
                    },
                    403: { description: "Permission denied or prescription outside duty roster" }
                }
            },
            delete: {
                tags: ["Nurse Prescription Services"],
                summary: "Delete an e-prescription by nurse",
                description: "Deletes a prescription log for an assigned ward patient.",
                parameters: [
                    {
                        in: "path",
                        name: "prescriptionId",
                        required: true,
                        schema: { type: "string" },
                        example: "66a8db123a167f0b6ee117c2"
                    }
                ],
                responses: {
                    200: {
                        description: "Prescription record deleted.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        status: { type: "string", example: "success" },
                                        data: {
                                            type: "object",
                                            properties: {
                                                deleted: { type: "boolean", example: true },
                                                prescriptionId: { type: "string", example: "66a8db123a167f0b6ee117c2" }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    403: { description: "Administrative execution denied" }
                }
            }
        },
        "/api/v1/nurse/inpatient/treatment-queue": {
            get: {
                tags: ["Nurse Inpatient Administration"],
                summary: "Fetch inpatient treatment queue (Doctor alias)",
                description: "Retrieves active inpatient treatment queue for assigned patients.",
                parameters: [
                    {
                        in: "header",
                        name: "x-user-email",
                        required: true,
                        schema: { type: "string" },
                        example: "nurse@careos.com",
                        description: "Email of the authenticated nurse"
                    }
                ],
                responses: {
                    200: {
                        description: "Queue fetched successfully.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        status: { type: "string", example: "success" },
                                        data: { type: "array", items: { type: "object" } }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        "/api/v1/nurse/inpatient/treatment-plan": {
            post: {
                tags: ["Nurse Inpatient Administration"],
                summary: "Submit inpatient treatment plan order",
                description: "Allows nurses to submit inpatient treatment plan orders if authorized.",
                parameters: [
                    {
                        in: "header",
                        name: "x-user-email",
                        required: true,
                        schema: { type: "string" },
                        example: "nurse@careos.com",
                        description: "Email of the authenticated nurse"
                    }
                ],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["admissionId", "treatmentHeading", "items", "scheduledDate", "scheduledTime"],
                                properties: {
                                    admissionId: { type: "string", example: "66a8db123a167f0b6ee117c2" },
                                    treatmentHeading: { type: "string", example: "Routine Dressing & Saline Drip" },
                                    scheduledDate: { type: "string", format: "date", example: "2026-07-30" },
                                    scheduledTime: { type: "string", example: "10:00 AM" },
                                    items: { type: "array", items: { type: "object" } }
                                }
                            }
                        }
                    }
                },
                responses: {
                    201: {
                        description: "Treatment plan created successfully.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        status: { type: "string", example: "success" },
                                        data: { type: "object" }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        "/api/v1/nurse/inpatient/treatment-plan/{planId}": {
            put: {
                tags: ["Nurse Inpatient Administration"],
                summary: "Update inpatient treatment plan order",
                description: "Modifies pending treatment plan items prior to administration.",
                parameters: [
                    {
                        in: "path",
                        name: "planId",
                        required: true,
                        schema: { type: "string" },
                        example: "66a8db123a167f0b6ee117c2"
                    },
                    {
                        in: "header",
                        name: "x-user-email",
                        required: true,
                        schema: { type: "string" },
                        example: "nurse@careos.com",
                        description: "Email of the authenticated nurse"
                    }
                ],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    treatmentHeading: { type: "string", example: "Updated Treatment Order" },
                                    scheduledDate: { type: "string", format: "date", example: "2026-07-30" },
                                    scheduledTime: { type: "string", example: "11:00 AM" },
                                    items: { type: "array", items: { type: "object" } }
                                }
                            }
                        }
                    }
                },
                responses: {
                    200: {
                        description: "Treatment plan modified successfully.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        status: { type: "string", example: "success" },
                                        data: { type: "object" }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        "/api/v1/lab-technician/eligible-patients": {
            get: {
                tags: ["Lab Technician Operations"],
                summary: "Fetch all eligible lab rosters for technician",
                description: "Retrieves list of prescriptions containing diagnostic lab test requests, indicating ownership status ('available', 'claimed_by_me', 'claimed_by_other') and current pipeline status.",
                parameters: [
                    {
                        in: "header",
                        name: "x-user-email",
                        required: false,
                        schema: { type: "string" },
                        example: "lab@careos.com"
                    },
                ],
                responses: {
                    200: {
                        description: "Eligible lab patient roster fetched successfully.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        status: { type: "string", example: "success" },
                                        data: {
                                            type: "array",
                                            items: {
                                                type: "object",
                                                properties: {
                                                    prescriptionId: { type: "string", example: "66a8db123a167f0b6ee117c2" },
                                                    appointmentId: { type: "string", example: "66a8db123a167f0b6ee117c1" },
                                                    patientName: { type: "string", example: "Rajesh Sharma" },
                                                    patientEmail: { type: "string", example: "patient@careos.com" },
                                                    doctorName: { type: "string", example: "Dr. Rohan Joshi" },
                                                    doctorEmail: { type: "string", example: "doctor@careos.com" },
                                                    labTests: { type: "array", items: { type: "string" }, example: ["Complete Blood Count (CBC)", "Lipid Profile"] },
                                                    ownershipStatus: { type: "string", enum: ["available", "claimed_by_me", "claimed_by_other"], example: "available" },
                                                    labHistoryId: { type: "string", example: null },
                                                    currentPipelineStatus: { type: "string", example: null },
                                                    billingAmount: { type: "number", example: 0 }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    401: { description: "User verification tracking context missing" }
                }
            }
        },
        "/api/v1/lab-technician/claim-task": {
            post: {
                tags: ["Lab Technician Operations"],
                summary: "Claim a prescription lab test task",
                description: "Claims an unclaimed lab test prescription and initializes a LabReportHistory pipeline record for the technician.",
                parameters: [
                    {
                        in: "header",
                        name: "x-user-email",
                        required: false,
                        schema: { type: "string" },
                        example: "lab@careos.com"
                    },
                ],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["prescriptionId"],
                                properties: {
                                    prescriptionId: { type: "string", example: "66a8db123a167f0b6ee117c2" },
                                    labTechId: { type: "string", example: "66a8db123a167f0b6ee117c0" }
                                }
                            }
                        }
                    }
                },
                responses: {
                    201: {
                        description: "Task claimed successfully.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        status: { type: "string", example: "success" },
                                        message: { type: "string", example: "Task claimed successfully." },
                                        data: {
                                            type: "object",
                                            properties: {
                                                _id: { type: "string", example: "66a8db123a167f0b6ee117c3" },
                                                prescriptionId: { type: "string", example: "66a8db123a167f0b6ee117c2" },
                                                status: { type: "string", example: "initialized" },
                                                statusTimestamps: { type: "object" }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    400: { description: "Prescription context reference missing" },
                    401: { description: "Lab technician identity trace missing" },
                    404: { description: "Prescription or patient identity record missing" },
                    409: { description: "Prescription test pipeline already claimed" }
                }
            }
        },
        "/api/v1/lab-technician/history/{historyId}/pipeline": {
            patch: {
                tags: ["Lab Technician Operations"],
                summary: "Advance lab status pipeline stage",
                description: "Updates status pipeline stage ('confirmed', 'collected', 'pending', 'completed'). When marking 'completed', findings, notes, and billingAmount are mandatory.",
                parameters: [
                    {
                        in: "path",
                        name: "historyId",
                        required: true,
                        schema: { type: "string" },
                        example: "66a8db123a167f0b6ee117c3",
                        description: "MongoDB ObjectId of the LabReportHistory record"
                    },
                    {
                        in: "header",
                        name: "x-user-email",
                        required: false,
                        schema: { type: "string" },
                        example: "lab@careos.com"
                    },
                ],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["status"],
                                properties: {
                                    status: { type: "string", enum: ["initialized", "confirmed", "collected", "pending", "completed"], example: "completed" },
                                    findings: { type: "string", example: "Hemoglobin 14.2 g/dL, WBC count within normal limits." },
                                    notes: { type: "string", example: "Sample collected fasting." },
                                    billingAmount: { type: "number", example: 650 },
                                    labTechId: { type: "string", example: "66a8db123a167f0b6ee117c0" }
                                }
                            }
                        }
                    }
                },
                responses: {
                    200: {
                        description: "Pipeline status updated successfully.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        status: { type: "string", example: "success" },
                                        message: { type: "string", example: "Pipeline status set to: completed." },
                                        data: { type: "object" }
                                    }
                                }
                            }
                        }
                    },
                    400: { description: "Invalid history ID or missing billing amount on completion" },
                    403: { description: "Unauthorized modification access: Locked to another technician" },
                    404: { description: "Active tracking document missing" }
                }
            }
        },
        "/api/v1/lab-technician/billing-history": {
            get: {
                tags: ["Lab Technician Billing"],
                summary: "Fetch lab technician billing history ledger",
                description: "Retrieves completed diagnostic lab reports partitioned into pendingBilling (unbilled) and completedBilling (billed/paid).",
                parameters: [
                    {
                        in: "header",
                        name: "x-user-email",
                        required: false,
                        schema: { type: "string" },
                        example: "lab@careos.com"
                    },
                ],
                responses: {
                    200: {
                        description: "Lab billing ledger retrieved successfully.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        status: { type: "string", example: "success" },
                                        data: {
                                            type: "object",
                                            properties: {
                                                pendingBilling: { type: "array", items: { type: "object" } },
                                                completedBilling: { type: "array", items: { type: "object" } }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    401: { description: "User verification tracking identifier missing" }
                }
            }
        },
        "/api/v1/lab-technician/billing/{historyId}/collect": {
            patch: {
                tags: ["Lab Technician Billing"],
                summary: "Collect lab invoice payment and mark billed",
                description: "Marks a completed lab test report as billed/settled (`isBilled = true`) and syncs central invoice ledger.",
                parameters: [
                    {
                        in: "path",
                        name: "historyId",
                        required: true,
                        schema: { type: "string" },
                        example: "66a8db123a167f0b6ee117c3"
                    },
                    {
                        in: "header",
                        name: "x-user-email",
                        required: false,
                        schema: { type: "string" },
                        example: "lab@careos.com"
                    },
                ],
                requestBody: {
                    required: false,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    labTechId: { type: "string", example: "66a8db123a167f0b6ee117c0" }
                                }
                            }
                        }
                    }
                },
                responses: {
                    200: {
                        description: "Lab payment verified and invoice settled.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        status: { type: "string", example: "success" },
                                        message: { type: "string", example: "Payment verified. Invoice successfully settled and archived." },
                                        data: { type: "object" }
                                    }
                                }
                            }
                        }
                    },
                    400: { description: "Cannot finalize billing for uncompleted lab pipeline" },
                    403: { description: "Locked to another technician" },
                    404: { description: "Active diagnostic billing record missing" },
                    409: { description: "Invoice tracking record already paid and settled" }
                }
            }
        },
        "/api/v1/pharmacist/pharmacy/dispense-queue": {
            get: {
                tags: ["Pharmacist Operations"],
                summary: "Fetch active pharmacy dispensing queue",
                description: "Retrieves all eligible prescriptions containing prescribed medicines along with current stock verification, required quantities, and available alternative substitutions.",
                parameters: [
                    {
                        in: "header",
                        name: "x-user-email",
                        required: true,
                        schema: { type: "string" },
                        example: "pharmacy@careos.com",
                        description: "Email of the authenticated pharmacist"
                    }
                ],
                responses: {
                    200: {
                        description: "Active dispensing queue retrieved successfully.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        status: { type: "string", example: "success" },
                                        count: { type: "number", example: 3 },
                                        data: {
                                            type: "array",
                                            items: {
                                                type: "object",
                                                properties: {
                                                    prescriptionId: { type: "string", example: "66a8db123a167f0b6ee117c2" },
                                                    appointmentId: { type: "string", example: "66a8db123a167f0b6ee117c1" },
                                                    patientEmail: { type: "string", example: "patient@careos.com" },
                                                    patientName: { type: "string", example: "Rajesh Sharma" },
                                                    patientPhone: { type: "string", example: "9876543210" },
                                                    doctorEmail: { type: "string", example: "doctor@careos.com" },
                                                    doctorName: { type: "string", example: "Dr. Rohan Joshi" },
                                                    prescriptionName: { type: "string", example: "Acute Pain Management" },
                                                    diagnosis: { type: "string", example: "Severe Migraine" },
                                                    medicines: { type: "array", items: { type: "object" } },
                                                    labReports: { type: "array", items: { type: "string" } },
                                                    isReentryUpdate: { type: "boolean", example: false }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    500: { description: "Failed to retrieve active pharmacy dispensing queue" }
                }
            }
        },
        "/api/v1/pharmacist/pharmacy/medicines/search-alternatives": {
            get: {
                tags: ["Pharmacist Operations"],
                summary: "Search alternative medicines by chemical composition",
                description: "Finds active in-stock pharmaceutical items sharing a matching chemical composition.",
                parameters: [
                    {
                        in: "query",
                        name: "composition",
                        required: true,
                        schema: { type: "string" },
                        example: "Paracetamol 500mg"
                    },
                    {
                        in: "header",
                        name: "x-user-email",
                        required: true,
                        schema: { type: "string" },
                        example: "pharmacy@careos.com",
                        description: "Email of the authenticated pharmacist"
                    }
                ],
                responses: {
                    200: {
                        description: "Matching chemical composition alternatives returned.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        status: { type: "string", example: "success" },
                                        count: { type: "number", example: 2 },
                                        data: { type: "array", items: { type: "object" } }
                                    }
                                }
                            }
                        }
                    },
                    400: { description: "Composition query target parameter required" }
                }
            }
        },
        "/api/v1/pharmacist/pharmacy/medicines/search-by-usecase": {
            get: {
                tags: ["Pharmacist Operations"],
                summary: "Search alternative medicines by therapeutic usecase",
                description: "Finds in-stock alternative medicines for a given clinical usecase, with optional exclusion of the original brand name.",
                parameters: [
                    {
                        in: "query",
                        name: "usecase",
                        required: true,
                        schema: { type: "string" },
                        example: "Analgesic / Antipyretic"
                    },
                    {
                        in: "query",
                        name: "excludeMedicine",
                        required: false,
                        schema: { type: "string" },
                        example: "Crocin 500"
                    },
                    {
                        in: "header",
                        name: "x-user-email",
                        required: true,
                        schema: { type: "string" },
                        example: "pharmacy@careos.com",
                        description: "Email of the authenticated pharmacist"
                    }
                ],
                responses: {
                    200: {
                        description: "Alternate medicines returned successfully.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        status: { type: "string", example: "success" },
                                        count: { type: "number", example: 4 },
                                        data: { type: "array", items: { type: "object" } }
                                    }
                                }
                            }
                        }
                    },
                    400: { description: "Medicine use case parameter is required" }
                }
            }
        },
        "/api/v1/pharmacist/pharmacy/dispense-secure/{prescriptionId}": {
            post: {
                tags: ["Pharmacist Operations"],
                summary: "Process medicine dispensing checkout with optional substitutions",
                description: "Deducts stock from inventory, handles brand substitutions and skips, registers MedicineHistory, and issues a PharmacyInvoice.",
                parameters: [
                    {
                        in: "path",
                        name: "prescriptionId",
                        required: true,
                        schema: { type: "string" },
                        example: "66a8db123a167f0b6ee117c2"
                    },
                    {
                        in: "header",
                        name: "x-user-email",
                        required: true,
                        schema: { type: "string" },
                        example: "pharmacy@careos.com",
                        description: "Email of the authenticated pharmacist"
                    }
                ],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    pharmacistEmail: { type: "string", example: "pharmacy@careos.com" },
                                    substitutions: {
                                        type: "array",
                                        items: {
                                            type: "object",
                                            required: ["originalMedicine"],
                                            properties: {
                                                originalMedicine: { type: "string", example: "Dolo 650" },
                                                chosenAlternate: { type: "string", example: "Calpol 650" },
                                                patientAllowed: { type: "boolean", example: true },
                                                customQuantity: { type: "number", example: 10 }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                responses: {
                    200: {
                        description: "Dispensing complete, inventory stock updated, and invoice generated.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        status: { type: "string", example: "success" },
                                        message: { type: "string", example: "Checkout complete. Stock reconciled and finalized invoice statement updated." },
                                        data: {
                                            type: "object",
                                            properties: {
                                                history: { type: "object" },
                                                invoice: { type: "object" },
                                                summary: { type: "object" }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    400: { description: "Invalid prescription ID or no medicines could be dispensed" },
                    401: { description: "Pharmacist email verification required" },
                    404: { description: "Prescription record not found" }
                }
            }
        },
        "/api/v1/pharmacist/pharmacy/billing/ledger": {
            get: {
                tags: ["Pharmacist Operations"],
                summary: "Fetch pharmacy billing ledger",
                description: "Retrieves all pharmacy invoices partitioned into pending, paid, and cancelled categories.",
                parameters: [
                    {
                        in: "header",
                        name: "x-user-email",
                        required: true,
                        schema: { type: "string" },
                        example: "pharmacy@careos.com"
                    }
                ],
                responses: {
                    200: {
                        description: "Pharmacy billing ledger retrieved successfully.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        status: { type: "string", example: "success" },
                                        data: {
                                            type: "object",
                                            properties: {
                                                pending: { type: "array", items: { type: "object" } },
                                                paid: { type: "array", items: { type: "object" } },
                                                cancelled: { type: "array", items: { type: "object" } }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        "/api/v1/pharmacist/pharmacy/billing/{invoiceId}/pay-cash": {
            patch: {
                tags: ["Pharmacist Operations"],
                summary: "Settle pharmacy invoice via Cash payment",
                description: "Marks a pending pharmacy invoice as Paid and syncs the central billing ledger.",
                parameters: [
                    {
                        in: "path",
                        name: "invoiceId",
                        required: true,
                        schema: { type: "string" },
                        example: "66a8db123a167f0b6ee117c3"
                    },
                    {
                        in: "header",
                        name: "x-user-email",
                        required: true,
                        schema: { type: "string" },
                        example: "pharmacy@careos.com",
                        description: "Email of the authenticated pharmacist"
                    }
                ],
                requestBody: {
                    required: false,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    pharmacistEmail: { type: "string", example: "pharmacy@careos.com" }
                                }
                            }
                        }
                    }
                },
                responses: {
                    200: {
                        description: "Invoice settled via Cash and archived.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        status: { type: "string", example: "success" },
                                        message: { type: "string", example: "Invoice successfully settled via Cash and archived to historical records ledger." },
                                        data: { type: "object" }
                                    }
                                }
                            }
                        }
                    },
                    400: { description: "Invalid invoice ID or status not Pending" },
                    404: { description: "Pharmacy invoice statement not found" }
                }
            }
        },
        "/api/v1/pharmacist/pharmacy/billing/{invoiceId}/void": {
            patch: {
                tags: ["Pharmacist Operations"],
                summary: "Cancel and void pharmacy invoice",
                description: "Voids an unpaid pending pharmacy invoice.",
                parameters: [
                    {
                        in: "path",
                        name: "invoiceId",
                        required: true,
                        schema: { type: "string" },
                        example: "66a8db123a167f0b6ee117c3"
                    },
                    {
                        in: "header",
                        name: "x-user-email",
                        required: true,
                        schema: { type: "string" },
                        example: "pharmacy@careos.com",
                        description: "Email of the authenticated pharmacist"
                    }
                ],
                requestBody: {
                    required: false,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    pharmacistEmail: { type: "string", example: "pharmacy@careos.com" }
                                }
                            }
                        }
                    }
                },
                responses: {
                    200: {
                        description: "Pharmacy invoice cancelled successfully.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        status: { type: "string", example: "success" },
                                        message: { type: "string", example: "Invoice cancelled and inventory ticket voided successfully." },
                                        data: { type: "object" }
                                    }
                                }
                            }
                        }
                    },
                    400: { description: "Invalid invoice ID or already settled" },
                    404: { description: "Pharmacy invoice not found" }
                }
            }
        },
        "/api/v1/pharmacist/pharmacy/inventory": {
            get: {
                tags: ["Pharmacy Inventory Management"],
                summary: "Fetch medicine inventory stock catalog",
                description: "Retrieves complete medicine inventory catalog with optional search filter by barcode, medicine name, composition, company, or category.",
                parameters: [
                    {
                        in: "header",
                        name: "x-user-email",
                        required: true,
                        schema: { type: "string" },
                        example: "pharmacy@careos.com"
                    },
                    {
                        in: "query",
                        name: "search",
                        required: false,
                        schema: { type: "string" },
                        example: "Paracetamol"
                    }
                ],
                responses: {
                    200: {
                        description: "Inventory stock catalog retrieved successfully.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        status: { type: "string", example: "success" },
                                        count: { type: "number", example: 15 },
                                        data: { type: "array", items: { type: "object" } }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        "/api/v1/pharmacist/pharmacy/inventory/{medicineId}/quantity": {
            patch: {
                tags: ["Pharmacy Inventory Management"],
                summary: "Update inventory stock count volume",
                description: "Reconciles and updates stock unit volume for a specific catalog medicine.",
                parameters: [
                    {
                        in: "path",
                        name: "medicineId",
                        required: true,
                        schema: { type: "string" },
                        example: "66a8db123a167f0b6ee117c2"
                    },
                    {
                        in: "header",
                        name: "x-user-email",
                        required: true,
                        schema: { type: "string" },
                        example: "pharmacy@careos.com",
                        description: "Email of the authenticated pharmacist"
                    }
                ],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["quantity"],
                                properties: {
                                    quantity: { type: "number", example: 150 }
                                }
                            }
                        }
                    }
                },
                responses: {
                    200: {
                        description: "Stock volume reconciled completely.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        status: { type: "string", example: "success" },
                                        message: { type: "string", example: "Inventory volume metrics reconciled completely." },
                                        data: { type: "object" }
                                    }
                                }
                            }
                        }
                    },
                    400: { description: "Quantity must be a non-negative integer" },
                    404: { description: "Target medicine document not found" }
                }
            }
        },
        "/api/v1/pharmacist/pharmacy/inventory/add": {
            post: {
                tags: ["Pharmacy Inventory Management"],
                summary: "Register new medicine in inventory catalog",
                description: "Adds a new pharmaceutical item into the global medicine catalog.",
                parameters: [
                    {
                        in: "header",
                        name: "x-user-email",
                        required: true,
                        schema: { type: "string" },
                        example: "pharmacy@careos.com",
                        description: "Email of the authenticated pharmacist"
                    }
                ],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["barcode", "medicine_name", "company", "category", "composition", "price", "quantity", "manufacture_date", "expiry_date"],
                                properties: {
                                    barcode: { type: "number", example: 8901234567890 },
                                    medicine_name: { type: "string", example: "Amoxicillin 500mg" },
                                    company: { type: "string", example: "Cipla Health" },
                                    category: { type: "string", example: "Antibiotics" },
                                    composition: { type: "string", example: "Amoxicillin Trihydrate 500mg" },
                                    price: { type: "number", example: 120.5 },
                                    quantity: { type: "number", example: 200 },
                                    manufacture_date: { type: "string", format: "date", example: "2025-01-01" },
                                    expiry_date: { type: "string", format: "date", example: "2027-12-31" },
                                    medicine_usecase: { type: "string", example: "Bacterial Infections" },
                                    specialization: { type: "string", example: "General Medicine" }
                                }
                            }
                        }
                    }
                },
                responses: {
                    201: {
                        description: "New pharmaceutical formulation added successfully.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        status: { type: "string", example: "success" },
                                        message: { type: "string", example: "New pharmaceutical formulation successfully introduced into global active catalog rosters." },
                                        data: { type: "object" }
                                    }
                                }
                            }
                        }
                    },
                    400: { description: "Missing required schema properties" },
                    409: { description: "Listing already exists matching brand name or barcode" }
                }
            }
        },
        "/api/v1/pharmacist/pharmacy/inventory/{medicineId}": {
            patch: {
                tags: ["Pharmacy Inventory Management"],
                summary: "Update medicine catalog details",
                description: "Modifies price, quantity, expiry date, composition, or metadata for an existing catalog medicine.",
                parameters: [
                    {
                        in: "path",
                        name: "medicineId",
                        required: true,
                        schema: { type: "string" },
                        example: "66a8db123a167f0b6ee117c2"
                    },
                    {
                        in: "header",
                        name: "x-user-email",
                        required: true,
                        schema: { type: "string" },
                        example: "pharmacy@careos.com",
                        description: "Email of the authenticated pharmacist"
                    }
                ],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    medicine_name: { type: "string", example: "Amoxicillin 500mg Capsule" },
                                    company: { type: "string", example: "Cipla" },
                                    category: { type: "string", example: "Antibiotic" },
                                    composition: { type: "string", example: "Amoxicillin Trihydrate" },
                                    price: { type: "number", example: 125.0 },
                                    quantity: { type: "number", example: 180 },
                                    manufacture_date: { type: "string", format: "date", example: "2025-01-01" },
                                    expiry_date: { type: "string", format: "date", example: "2027-12-31" },
                                    medicine_usecase: { type: "string", example: "Bacterial Infection Treatment" },
                                    specialization: { type: "string", example: "General Medicine" }
                                }
                            }
                        }
                    }
                },
                responses: {
                    200: {
                        description: "Medicine details updated successfully.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        status: { type: "string", example: "success" },
                                        message: { type: "string", example: "Medicine details updated successfully." },
                                        data: { type: "object" }
                                    }
                                }
                            }
                        }
                    },
                    404: { description: "Medicine not found" }
                }
            }
        },
        "/api/v1/pharmacist/pharmacy/dashboard/summary": {
            get: {
                tags: ["Pharmacist Operations"],
                summary: "Fetch pharmacist dashboard metrics and low-stock inventory telemetry",
                description: "Returns summary metrics (pending amount, completed revenue) along with inventory items sorted low-to-high by stock quantity.",
                parameters: [
                    {
                        in: "header",
                        name: "x-user-email",
                        required: true,
                        schema: { type: "string" },
                        example: "pharmacy@careos.com"
                    },
                    {
                        in: "query",
                        name: "search",
                        required: false,
                        schema: { type: "string" },
                        example: "Dolo"
                    }
                ],
                responses: {
                    200: {
                        description: "Dashboard telemetry data compiled successfully.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        status: { type: "string", example: "success" },
                                        data: {
                                            type: "object",
                                            properties: {
                                                metrics: {
                                                    type: "object",
                                                    properties: {
                                                        pendingAmount: { type: "number", example: 1450 },
                                                        completedAmount: { type: "number", example: 12800 }
                                                    }
                                                },
                                                inventory: { type: "array", items: { type: "object" } }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
};