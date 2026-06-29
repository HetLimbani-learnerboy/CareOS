// import mongoose from "mongoose";
// import bcrypt from "bcryptjs";
// import SystemCounter from "./counter.model.js";

// const UserIdentitySchema = new mongoose.Schema(
//   {
//     id: {
//       type: Number,
//       unique: true,
//     },

//     firstName: {
//       type: String,
//       required: true,
//       trim: true,
//     },

//     lastName: {
//       type: String,
//       required: true,
//       trim: true,
//     },

//     email: {
//       type: String,
//       required: true,
//       unique: true,
//       index: true,
//       lowercase: true,
//       trim: true,
//     },

//     countryCode: {
//       type: String,
//       required: true,
//       trim: true,
//     },

//     phone: {
//       type: String,
//       required: true,
//       unique: true,
//       trim: true,
//     },

//     password: {
//       type: String,
//       required: true,
//     },

//     role: {
//       type: String,
//       enum: [
//         "hospital_admin",
//         "doctor",
//         "nurse",
//         "lab_technician",
//         "pharmacist",
//         "receptionist",
//         "patient",
//       ],
//       default: "patient",
//     },

//     profile_image: {
//       type: String,
//       default: null,
//     },

//     is_verified: {
//       type: Boolean,
//       default: false,
//     },
//   },
//   {
//     timestamps: true,
//     collection: "user_identities",
//   }
// );

// UserIdentitySchema.pre("save", async function () {
//   if (this.isNew) {
//     const counter = await SystemCounter.findByIdAndUpdate(
//       "user_identity_id",
//       {
//         $inc: {
//           sequence_value: 1,
//         },
//       },
//       {
//         upsert: true,
//         returnDocument: "after",
//       }
//     );

//     this.id = counter.sequence_value;
//   }

//   if (!this.isModified("password")) {
//     return;
//   }

//   const salt = await bcrypt.genSalt(12);

//   this.password = await bcrypt.hash(
//     this.password,
//     salt
//   );
// });

// export default mongoose.model(
//   "UserIdentity",
//   UserIdentitySchema
// );

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import SystemCounter from "./counter.model.js";

const UserIdentitySchema = new mongoose.Schema(
  {
    id: {
      type: Number,
      unique: true,
    },

    firstName: {
      type: String,
      required: true,
      trim: true,
    },

    lastName: {
      type: String,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      index: true,
      lowercase: true,
      trim: true,
    },

    countryCode: {
      type: String,
      trim: true,
    },

    phone: {
      type: String,
      unique: true,
      trim: true,
    },

    password: {
      type: String,
    },

    role: {
      type: String,
      enum: [
        "hospital_admin",
        "doctor",
        "nurse",
        "lab_technician",
        "pharmacist",
        "receptionist",
        "patient",
      ],
      default: "patient",
    },

    profile_image: {
      type: String,
      default: null,
    },

    is_verified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    collection: "user_identities",
  }
);

UserIdentitySchema.pre("save", async function () {
  if (this.isNew) {
    const counter = await SystemCounter.findByIdAndUpdate(
      "user_identity_id",
      {
        $inc: {
          sequence_value: 1,
        },
      },
      {
        upsert: true,
        returnDocument: "after",
      }
    );

    this.id = counter.sequence_value;
  }

  if (!this.isModified("password")) {
    return;
  }

  const salt = await bcrypt.genSalt(12);

  this.password = await bcrypt.hash(
    this.password,
    salt
  );
});

export default mongoose.model(
  "UserIdentity",
  UserIdentitySchema
);