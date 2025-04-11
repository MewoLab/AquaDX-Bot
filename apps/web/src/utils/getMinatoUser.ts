import { UserProfile } from '@clansty/maibot-clients';

export default async (usernameEncoded: string) => {
	return await UserProfile.create({
		type: 'Minato',
		username: decodeURIComponent(usernameEncoded),
	});
}
