import { object, string, refine, size } from "superstruct";

const Nickname = size(string(), 2, 30);
const RegistrationNickname = refine(
    Nickname,
    "RegistrationNickname",
    (value) => !/[^a-zA-Z0-9_]/.test(value) || "Nickname contains invalid characters",
);
const Password = size(string(), 6, 30);

export const registrationStruct = refine(
    object({
        nickname: RegistrationNickname,
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
