import { Button, Paper, PasswordInput, TextInput, Title } from '@mantine/core';
import React, {useLayoutEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { App } from 'antd';
import { yupResolver } from 'mantine-form-yup-resolver';
import * as yup from 'yup';
import { useForm } from '@mantine/form';
import { useMutation } from 'react-query';
import { login } from '../../services/authservice';
import { LoginInterface } from '../../interfaces/login.interface';
import useSignIn from 'react-auth-kit/hooks/useSignIn';
import useIsAuthenticated from 'react-auth-kit/hooks/useIsAuthenticated';

const schema = yup.object().shape({
  username: yup
    .string()
    .required('Invalid login')
    .email('Invalid email'),
    password: yup
    .string()
    .required('Invalid login')
    .min(6, 'invalid password'),
});

const SignIn: React.FC = () => {

  const navigate = useNavigate();
  const isAuthenticated = useIsAuthenticated()
  useLayoutEffect((): void => {
    if(isAuthenticated()) {
      navigate('/dashboard', { replace: true })
    }
    }, []);

  const { message } = App.useApp();
  const signIn = useSignIn();

  const form = useForm({
    initialValues: {
      username: '',
      password: '',
    },
    validate: yupResolver(schema),
  });


  const { mutate, isLoading } = useMutation((data: LoginInterface) => login(data), {
    onSuccess(data) {
      message.success("Connection Réussi !!");
      if (
        signIn({auth: {
          token:data?.token,
          type: 'Bearer'
      },
      userState:{ id: data?.id,prenom: data?.prenom, nom: data?.nom,fonction: data?.fonction}
    })
      ) {
        const targetDashboard = "/dashboard";
        navigate(targetDashboard, { replace: true });
      } else {
        message.error("Connection Echouée !!!");
      }
    },
    onError: (_) => {
      message.error("Identifiant et/ou mot de passe incorrecte !!");
    },
  });

  const onLogin = (values: LoginInterface) => {
    mutate(values);
  }

  return (
    <>
      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="flex flex-wrap items-center">
          <div className="w-full border-stroke dark:border-strokedark xl:w-1/2 xl:border-l-2 hidden lg:block">
          <img src='/img/img.jpg'/>
          </div>
          <div className="w-full border-stroke dark:border-strokedark xl:w-1/2 xl:border-l-2">
            <div className="w-full my-10">
            <div className="px-26 text-center">
              <Link className="mb-5.5 inline-block" to="/">
                <img className="hidden dark:block w-40 h-40" src='/logo.png' alt="Logo" />
                <img className="dark:hidden w-40 h-40" src='/logo-bg.png' alt="Logo" />
              </Link>
            </div>
              

              <form onSubmit={form.onSubmit(onLogin)}>
              <Paper radius={0} p={30}>
        <Title order={2} ta="center" mt="md" mb={50}>
          FINANCE CROUS/Z
        </Title>

        <TextInput label="Utilisateur" {...form.getInputProps('username')} placeholder="hello@gmail.com" size="md" />
        <PasswordInput label="Mot de passe" {...form.getInputProps('password')} placeholder="votre mot de passe" mt="md" size="md" />
        <Button type="submit" fullWidth mt="xl" size="md" loading={isLoading}>
          Se Connecter
        </Button>
      </Paper>

              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SignIn;
