import { useEffect, useState } from "react";
import { loginUser } from "../services/userService";

export function useUser() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {

      // مؤقتًا حتى نربط Telegram
      const telegramUser = {
        telegram_id: 123456789,
        username: "test_user",
        first_name: "Quizora",
        photo_url: null,
      };

      const { data } = await loginUser(telegramUser);

      setUser(data);
      setLoading(false);
    }

    loadUser();
  }, []);

  return {
    user,
    loading,
  };
}