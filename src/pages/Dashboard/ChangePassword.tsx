import { yupResolver } from 'mantine-form-yup-resolver';
import * as yup from 'yup';
import { useForm } from '@mantine/form';
import { useMutation, useQuery } from "react-query";
import {
  PasswordInput,
  Button,
  LoadingOverlay,
} from "@mantine/core";
import { App, Result } from 'antd';
import { getAuth, updatePassword } from '../../services/authservice';
import { useNavigate, useParams } from 'react-router-dom';
import { UserService } from '../../services/user.service';
import { FaUser } from 'react-icons/fa';


const schema = yup.object().shape({
      password: yup.string()
      .required('Invalid login')
      .min(6, 'invalid password'),
  });

function ChangePassword() {
    const { message } = App.useApp();
    const {id} = useParams();
    const navigate = useNavigate();
    const qk = ["user",id];
    const {data,isLoading:loading}  = useQuery(qk, () => getAuth(id!));
    const form = useForm({
        initialValues: {
          password: '',
        },
        validate: yupResolver(schema),
      });
    const { mutate, isLoading } = useMutation((data) => updatePassword(id!,data), {
        onSuccess(data) {
            message.success("Le mot de passe a été modifié !!");
            navigate("/dashboard/settings");
        },
        onError: (_) => {
            message.error("Modification echoue !");
        },
      });

    const onConnect = (data:any) => {
        mutate(data);
      };

  return (
    <>
    <LoadingOverlay
         visible={loading || isLoading}
         zIndex={1000}
         overlayProps={{ radius: 'sm', blur: 2 }}
         loaderProps={{ color: 'blue', type: 'bars' }}
       />

<Result
    icon={<FaUser className="h-32 w-32"/>}
    title={`${data?.prenom} ${data?.nom}`}
    subTitle={`${data?.login}`}
  />
    <div className="w-1/2 h-2/3 mx-auto text-white">
    <div className="card flex-shrink-0 w-full max-w-sm shadow-2xl bg-white p-4 animate__animated animate__zoomInLeft">
          <form onSubmit={form.onSubmit(onConnect)} className='flex flex-col space-y-2'>
          <PasswordInput label="Mot de passe" {...form.getInputProps('password')} placeholder="enter le mot de passe" mt="md" size="md" />
              <Button type="submit" className="bg-cyan-900 hover:bg-cyan-500" loading={isLoading}>
                CHANGER LE MOT DE PASSE
              </Button>
          </form>
        </div>
    </div>  
    </>
  )
}

export default ChangePassword