import { component$ } from '@builder.io/qwik';

export default component$(({ name, rare }: { name: string, rare: string }) =>
	<div class={`titleRare-${rare} font-[Kosugi_Maru] line-height-normal w-full border-1 border-solid rounded-full text-center box-border`}>
		{name}
		<style scoped>{`
        .titleRare-Normal {
            background-image: linear-gradient(to top, #DADADA 40%, #F9F9F9 40%);
            border-color: #DADADA
        }

        .titleRare-Bronze {
            background-image: linear-gradient(to top, #DD723E 40%, #FB9A6A 40%);
            border-color: #DD723E
        }

        .titleRare-Silver {
            background-image: linear-gradient(to top, #94B5E2 40%, #E0E3F8 40%);
            border-color: #94B5E2
        }

        .titleRare-Gold {
            background-image: linear-gradient(to top, #FABF05 40%, #FFDF4B 40%);
            border-color: #FABF05
        }

        .titleRare-Rainbow {
            background-repeat: no-repeat;
            background-size: 100% 60%, 100% 100%;
            background-image: linear-gradient(45deg, #fdc9aa 6%, #fdfd92 14%, #fdfd92 36%, #ddfda7 44%, #ddfda7 46%, #ddfdfd 54%, #ddfdfd 66%, #fde4fd 74%, #fde4fd 86%, #dff6fd 94%, #dff6fd 100%), linear-gradient(45deg, #faaa8b 6%, #fdfd92 14%, #fafa74 36%, #befa8c 44%, #befa8c 46%, #befafa 54%, #befafa 66%, #fac5fa 74%, #fac5fa 86%, #c1d7fa 94%, #c1d7fa 100%);
            border-color: #fac5fa;
            //border-image: linear-gradient(45deg, #faaa8b 6%, #fdfd92 14%, #fafa74 36%, #befa8c 44%, #befa8c 46%, #befafa 54%, #befafa 66%, #fac5fa 74%, #fac5fa 86%, #c1d7fa 94%, #c1d7fa 100%);
        }
		`}</style>
	</div>);
