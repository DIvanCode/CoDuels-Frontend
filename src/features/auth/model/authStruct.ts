import { object, string, refine, size } from "superstruct";

const Nickname = size(string(), 2, 30);
const Password = size(string(), 6, 30);

export const registrationStruct = refine(
    object({
        nickname: Nickname,
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
    nickname: Nickname,
    password: Password,
});
