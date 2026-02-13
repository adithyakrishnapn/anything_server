const slugify = require("slugify");

function toSlug(value) {
  return slugify(value, {
    lower: true,
    strict: true,
    trim: true,
  });
}

module.exports = { toSlug };
