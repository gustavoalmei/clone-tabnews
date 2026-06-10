function can(user, feature) {
  let authorization = false;

  if (user?.features.includes(feature)) {
    authorization = true
  }

  return authorization
}

const authorization = {
  can,
}

export default authorization