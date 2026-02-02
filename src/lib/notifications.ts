import { LocalNotifications } from '@capacitor/local-notifications';
import { supabase } from './supabase';

export interface NotificationMessage {
    title: string;
    body: string;
}

const ACTIVE_MESSAGES_MORNING: NotificationMessage[] = [
    { title: "좋은 아침이에요! ☀️", body: "오늘도 당신의 꿈에 한 걸음 더 가까워질 준비 되셨나요? 작심일년이 응원합니다!" },
    { title: "새로운 하루, 새로운 기회 🚀", body: "어제보다 더 나은 오늘을 만들어봐요. 지금 앱에서 할 일을 확인해보세요!" },
    { title: "할 수 있어요! ✨", body: "꾸준함이 비범함을 만듭니다. 오늘의 첫 번째 목표부터 시작해볼까요?" }
];

const ACTIVE_MESSAGES_EVENING: NotificationMessage[] = [
    { title: "오늘 하루도 고생 많았어요 🌙", body: "목표를 향한 당신의 노력, 정말 멋져요. 편안한 밤 보내세요!" },
    { title: "성장의 시간 📈", body: "오늘 하루 무엇을 이루셨나요? 작은 성취들을 기록하며 마무리해보세요." },
    { title: "내일이 더 기대돼요 🌟", body: "오늘의 노력이 내일의 당신을 만듭니다. 푹 쉬고 내일 또 만나요!" }
];

const FORGOTTEN_MESSAGES: NotificationMessage[] = [
    { title: "혹시... 저 잊으신 건 아니죠? 🦉", body: "목표들이 당신을 애타게 기다리고 있어요. 다시 시작하기 딱 좋은 때입니다!" },
    { title: "듀오링고 부엉이가 쫓아올지도 몰라요 💨", body: "작심삼일로 끝내기엔 당신의 목표가 너무 아깝잖아요? 얼른 돌아오세요!" },
    { title: "먼지가 쌓이고 있어요 🧹", body: "방치된 목표들이 울고 있습니다. 딱 5분만 투자해서 체크해보는 건 어때요?" },
    { title: "똑똑, 계세요? 🚪", body: "오랜만이에요! 당신이 그리웠어요. 다시 작심일년의 열정을 불태워봐요!" }
];

export async function requestNotificationPermission() {
    try {
        const perm = await LocalNotifications.checkPermissions();
        if (perm.display !== 'granted') {
            await LocalNotifications.requestPermissions();
        }
    } catch (e) {
        console.warn("Notification permissions check failed:", e);
    }
}

export async function scheduleNotifications(userId: string) {
    try {
        const { data: profile, error } = await (supabase as any)
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        // Silently fail if profiles table doesn't exist yet
        if (error || !profile) {
            console.warn("Profiles table not accessible, skipping notification scheduling.");
            return;
        }

        const lastActive = new Date(profile.last_active_at).getTime();
        const now = Date.now();
        const diffDays = (now - lastActive) / (1000 * 60 * 60 * 24);

        await LocalNotifications.cancel({ notifications: (await LocalNotifications.getPending()).notifications });

        const isForgotten = diffDays >= 3;
        const notifications = [];

        for (let i = 1; i <= 7; i++) {
            const morningDate = new Date();
            morningDate.setDate(morningDate.getDate() + i);
            morningDate.setHours(9, 0, 0, 0);

            const eveningDate = new Date();
            eveningDate.setDate(eveningDate.getDate() + i);
            eveningDate.setHours(19, 0, 0, 0);

            const morningMsg = isForgotten
                ? FORGOTTEN_MESSAGES[Math.floor(Math.random() * FORGOTTEN_MESSAGES.length)]
                : ACTIVE_MESSAGES_MORNING[Math.floor(Math.random() * ACTIVE_MESSAGES_MORNING.length)];

            const eveningMsg = isForgotten
                ? FORGOTTEN_MESSAGES[Math.floor(Math.random() * FORGOTTEN_MESSAGES.length)]
                : ACTIVE_MESSAGES_EVENING[Math.floor(Math.random() * ACTIVE_MESSAGES_EVENING.length)];

            notifications.push({
                title: morningMsg.title,
                body: morningMsg.body,
                id: i * 2,
                schedule: { at: morningDate },
                sound: 'default'
            });

            notifications.push({
                title: eveningMsg.title,
                body: eveningMsg.body,
                id: i * 2 + 1,
                schedule: { at: eveningDate },
                sound: 'default'
            });
        }

        await LocalNotifications.schedule({ notifications: notifications as any });
    } catch (e) {
        console.error("Failed to schedule notifications", e);
    }
}

export async function updateLastActive(userId: string) {
    try {
        await (supabase as any)
            .from('profiles')
            .update({ last_active_at: new Date().toISOString() })
            .eq('id', userId);
    } catch (e) {
        // Ignore error if profiles table doesn't exist
    }
}

export async function updateLastAction(userId: string) {
    try {
        await (supabase as any)
            .from('profiles')
            .update({ last_action_at: new Date().toISOString(), last_active_at: new Date().toISOString() })
            .eq('id', userId);
    } catch (e) {
        // Ignore error
    }
}
