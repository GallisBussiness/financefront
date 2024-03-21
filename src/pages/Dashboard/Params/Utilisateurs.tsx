import { useMutation, useQuery, useQueryClient } from "react-query";
import { UserService } from "../../../services/user.service";
import { useDisclosure } from "@mantine/hooks";
import { ActionIcon, Button, Drawer, LoadingOverlay,PasswordInput,Select,TextInput} from "@mantine/core";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Toolbar } from "primereact/toolbar";
import { useForm } from "@mantine/form";
import { yupResolver } from 'mantine-form-yup-resolver';
import * as yup from 'yup';
import { App, Popconfirm } from "antd";
import { BsFillPenFill } from 'react-icons/bs'
import { useState } from "react";
import { FilterMatchMode } from "primereact/api";
import { FaSearch, FaTrash } from "react-icons/fa";
import { MdOutlinePassword } from "react-icons/md";
import { useNavigate } from "react-router-dom";

const schema = yup.object().shape({
  prenom: yup.string().required("Prenom invalide"),
  nom: yup.string().required('Nom Invalide'),
  login: yup.string().required('Login requis'),
  password: yup.string().required('Password requise').min(6,'minimum 6 caracteres'),
  fonction: yup.string().required('Fonction requise'),
  role: yup.string().required('Role requis')
});


function Utilisateurs() {

const [opened, { open, close }] = useDisclosure(false);
const [openedU, { open:openU, close:closeU }] = useDisclosure(false);
const { message } = App.useApp();
const navigate = useNavigate();
const key = 'get_users';
const userService = new UserService();
const qc = useQueryClient();
const {data,isLoading} = useQuery(key,() => userService.getAll());
const form = useForm({
    initialValues: {
      prenom:'',
      nom: '',
      login: '',
      password:'',
      fonction: '',
      role:''
    },
    validate: yupResolver(schema),
  });
  const formU = useForm({
    initialValues: {
    _id:'',
     prenom:'',
      nom: '',
      login: '',
      password:'',
      fonction: '',
      role:''
    },
    validate: yupResolver(schema),
  });

const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    prenom: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
});
const [globalFilterValue, setGlobalFilterValue] = useState('');

const onGlobalFilterChange = (e: { target: { value: any; }; }) => {
    const value = e.target.value;
    let _filters = { ...filters };

    _filters['global'].value = value;

    setFilters(_filters);
    setGlobalFilterValue(value);
};
const renderHeader = () => {
    return (
        <div className="flex">
                <TextInput value={globalFilterValue} leftSection={<FaSearch/>} onChange={onGlobalFilterChange} placeholder="Rechercher..." />
        </div>
    );
};

const header = renderHeader();
 
const {mutate:createUser,isLoading:loadingCreate} = useMutation((data) => userService.create(data),{
    onSuccess:(_) => {
        message.success("utilisateur ajouté avec succès");
        close();
        qc.invalidateQueries(key);
        form.reset()
    },
    onError:(_) => {
    message.error("Impossible d'ajouter l'utilisateur");
    }
});

const {mutate:updateUser,isLoading:loadingU} = useMutation((data: any) => userService.update(data.id, data.data),{
    onSuccess:(_) => {
        message.success("Utilisateur modifié avec succès");
        closeU();
        qc.invalidateQueries(key);
    },
    onError:(_) => {
    message.error("Impossible d'ajouter l'utilisateur");
    }
});

const {mutate:deleteUser,isLoading:loadingDelete} = useMutation((id:string) => userService.delete(id),{
    onSuccess:(_) => {
        message.success("La suppression est effective.");
        closeU();
        qc.invalidateQueries(key);
    },
    onError:(_) => {
    message.error('Erreur de Suppression');
    }
});


  const confirm = (id : string) => {
    deleteUser(id)
  };
  
  const cancel = () => {
    message.info("L'action a été annulé !");
  };


const leftToolbarTemplate = () => {
    return (
        <div className="flex flex-wrap gap-2">
           <Button onClick={open}>NOUVEAU</Button>
        </div>
    );
};

const actionBodyTemplate = (rowData: any) => {
    return <div className="flex items-center justify-center space-x-1">
    <ActionIcon type="button"  onClick={() => handleUpdate(rowData)}>
    <BsFillPenFill className="text-white"/>
    </ActionIcon>
    <Popconfirm
    title="Suppression"
    description="Etes vous sure de supprimer?"
    onConfirm={() => confirm(rowData._id)}
    onCancel={() => cancel()}
    okText="Confirmer"
    okButtonProps={{className: "bg-blue-500"}}
    cancelButtonProps={{className: "bg-red-500"}}
    cancelText="Annuler"
  >
    <ActionIcon type="button" bg="red">
    <FaTrash className="text-white"/>
    </ActionIcon>
    </Popconfirm>
    <ActionIcon type="button"  onClick={() => navigate(`/dashboard/user/${rowData._id}`)}>
    <MdOutlinePassword className="text-white"/>
    </ActionIcon>
    </div>;
    
}

const onCreate = (values:any) => {
    createUser(values);
}
const onUpdate = (values:any) => {
    const {_id,createdAt,updatedAt,__v,...rest} = values;
    updateUser({id: _id,data: rest });
}

const handleUpdate  = (data: any) => {
    formU.setValues(data);
    openU();
}

  return (
    <>
    <LoadingOverlay
         visible={loadingDelete}
         zIndex={1000}
         overlayProps={{ radius: 'sm', blur: 2 }}
         loaderProps={{ color: 'blue', type: 'bars' }}
       />
    <div className="p-2 text-2xl font-semibold flex">GESTION  DES UTILISATEURS</div>
   <Toolbar className="mb-4" left={leftToolbarTemplate}></Toolbar>
   <DataTable value={data} paginator rows={10} size="small" stripedRows filters={filters} rowsPerPageOptions={[5, 10, 25, 50]} loading={isLoading} tableStyle={{ minWidth: '50rem' }}
    globalFilterFields={['prenom','nom']} header={header}>
    <Column field="prenom" header="PRENOM" style={{ width: '25%' }}></Column>
    <Column field="nom" header="NOM" style={{ width: '25%' }}></Column>
    <Column field="login" header="LOGIN" style={{ width: '25%' }}></Column>
    <Column field="role" header="ROLE" style={{ width: '25%' }}></Column>
   <Column headerStyle={{ width: '4rem', textAlign: 'center' }} bodyStyle={{ textAlign: 'center', overflow: 'visible' }} body={actionBodyTemplate} />
</DataTable>
   <Drawer opened={opened} onClose={close} title="CREATION  D'UTILISATEUR">
   <LoadingOverlay
         visible={loadingCreate}
         zIndex={1000}
         overlayProps={{ radius: 'sm', blur: 2 }}
         loaderProps={{ color: 'blue', type: 'bars' }}
       />
     <form onSubmit={form.onSubmit(onCreate)}>
     <TextInput
         withAsterisk
         label="PRENOM"
         {...form.getInputProps('prenom')}
       />
       <TextInput
         withAsterisk
         label="NOM"
         {...form.getInputProps('nom')}
       />
       <TextInput
         withAsterisk
         label="LOGIN"
         {...form.getInputProps('login')}
       />
       <TextInput
         withAsterisk
         label="FONCTION"
         {...form.getInputProps('fonction')}
       />
       <Select
        withAsterisk
        label="ROLE"
        {...form.getInputProps('role')}
        data={['admin','daf','csa','budget','acp','controle']}
       />
       <PasswordInput
         withAsterisk
         label="MOT DE PASSE"
         {...form.getInputProps('password')}
       />
       <div className="my-5">
           <Button type="submit">SAUVEGARDER</Button>
       </div>
       
     </form>
   </Drawer>

   <Drawer position="right" opened={openedU} onClose={closeU} title="MODIFICATION  DE UTILISATEUR">
   <LoadingOverlay
         visible={loadingU}
         zIndex={1000}
         overlayProps={{ radius: 'sm', blur: 2 }}
         loaderProps={{ color: 'blue', type: 'bars' }}
       />
     <form onSubmit={formU.onSubmit(onUpdate)}>
     <TextInput
         withAsterisk
         label="PRENOM"
         {...formU.getInputProps('prenom')}
       />
       <TextInput
         withAsterisk
         label="NOM"
         {...formU.getInputProps('nom')}
       />
       <TextInput
         withAsterisk
         label="LOGIN"
         {...formU.getInputProps('login')}
       />
       <TextInput
         withAsterisk
         label="FONCTION"
         {...formU.getInputProps('fonction')}
       />
       <Select
        withAsterisk
        label="ROLE"
        {...formU.getInputProps('role')}
        data={['admin','daf','csa','budget','acp','controle']}
       />
       <div className="my-5">
           <Button type="submit">MODIFIER</Button>
       </div>
       
     </form>
   </Drawer>
   </>
  )
}

export default Utilisateurs