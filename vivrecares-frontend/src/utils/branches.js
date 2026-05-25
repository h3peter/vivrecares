export const CLINIC_BRANCHES = ['Pasay Branch', 'Valenzuela Branch'];

export const activeBranchNames = (branches) => {
    if (!Array.isArray(branches) || branches.length === 0) {
        return CLINIC_BRANCHES;
    }

    return branches
        .filter((branch) => Number(branch.is_active ?? 1) === 1)
        .map((branch) => branch.branch_name || branch)
        .filter(Boolean);
};
