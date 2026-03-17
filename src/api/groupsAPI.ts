import instance from "./instance"

export const groupsAPI = {
  createGroups(name: string, selectedMember: string[], description: string) {
    // console.log("{ groupName, selectedMember, description }", {
    //   groupName,
    //   selectedMember,
    //   description,
    // })
    return instance
      .get("groups/create", {
        params: { name, selectedMember, description },
      })
      .then((res) => res.data)
  },
  getAllGroups() {
    return instance.get("groups/").then((res) => res.data)
  },
  getMessagesGroup(groupId: string, page: number, limit?: number) {
    return instance
      .get(`groups/group/${groupId}`, { params: { page, limit } })
      .then((res) => res.data)
  },
}
