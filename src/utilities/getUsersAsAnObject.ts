import { ICustomUser, User } from 'nc-db-new';

const getUsersAsAnObject = async ():Promise<Record<number, ICustomUser>> => {
  const usersObj:Record<number, ICustomUser> = {};
  const users = await User.findAll();

  users.forEach(({
    id,
    name,
    email,
    password,
    googleId,
    userRoleId,
    userStatusId,
    totalRevenue,
    paidRevenue,
    image,
    rejectionReason,
    createdBy,
    updatedBy,
  }) => {
    if (id) {
      usersObj[id] = {
        id,
        name,
        email,
        password,
        googleId,
        userRoleId,
        userStatusId,
        totalRevenue,
        paidRevenue,
        image,
        rejectionReason,
        createdBy,
        updatedBy,
      };
    }
  });
  return usersObj;
};

export default getUsersAsAnObject;
