import { routeLoader$ } from '@builder.io/qwik-city';
import { component$ } from '@builder.io/qwik';
import getAquaDxUser from '~/utils/getAquaDxUser';
import B50 from '~/routes/b50/components/B50';
import getMinatoUser from '~/utils/getMinatoUser';

export const useData = routeLoader$(async ({platform, params}) => {
    const profile = await getMinatoUser(params.username);
    const userRating = await profile.getUserRating();
    const userData = await profile.getNameplate();
    const profileVer = await profile.getVersion();
    
    return {userRating, userData, profileVer};
});

export default component$(() => {
    const data = useData();
    
    return <B50 rating={data.value.userRating} user={data.value.userData} ver={data.value.profileVer} />;
});
