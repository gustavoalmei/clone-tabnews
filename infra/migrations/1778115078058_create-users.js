exports.up = (pgm) => {
  pgm.createTable("users", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },

    // For reference, GitHub limits usernames to 39 characters.
    username: {
      type: "varchar(30)",
      notNull: true,
      unique: true,
    },

    email: {
      type: "varchar(254)",
      notNull: true,
      unique: true,
    },

    // The maximum length that the bcrypt algorithm can handle is 60 characters.
    password: {
      type: "varchar(60)",
      notNull: true,
    },

    // The timestamp with time zone type is used to store the creation date of the user.
    create_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func("timezone('utc', now())"),
    },

    updated_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func("timezone('utc', now())"),
    },
  })
};

exports.down = false;