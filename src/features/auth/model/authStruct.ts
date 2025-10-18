import { object, string, refine, size } from "superstruct";

const Username = size(string(), 2, 30);
const Password = size(string(), 6, 30);

export const registrationStruct = refine(
    object({
        email: string(),
        password: Password,
        confirmPassword: Password,
    }),
    "MatchPassword",
    (value) => {
        if (value.password === value.confirmPassword) {
            return true;
        }
        return "Passwords do not match";
    },
);

export const loginStruct = object({
    username: Username,
    password: Password,
});
