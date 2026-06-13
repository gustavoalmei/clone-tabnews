function can(user, feature, resource) {
  let authorization = false;

  if (user?.features.includes(feature)) {
    authorization = true
  }

  if (feature === "update:user" && resource) {
    authorization = false

    if (user.id === resource.id || can(user, 'update:user:others')) {
      authorization = true
    }
  }

  return authorization
}

const authorization = {
  can,
}

export default authorization