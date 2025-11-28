
export const createSchoolAbbreviation = (schoolName: string): string => {
    if (!schoolName) return "SCH";
    const words = schoolName.split(' ').filter(w => w.length > 0);
    if (words.length > 1) {
        return words.map(word => word[0]).join('').toUpperCase();
    }
    if (words.length === 1 && words[0].length > 0) {
        return words[0].substring(0, 3).toUpperCase();
    }
    return "SCH";
};

export const calculateAge = (dateOfBirth: string): number | null => {
    if (!dateOfBirth) return null;
    try {
        const birthDate = new Date(dateOfBirth);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    } catch (error) {
        console.error("Invalid date for age calculation:", dateOfBirth);
        return null;
    }
};
