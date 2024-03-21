import { useMutation, useQuery, useQueryClient } from "react-query";
import { FournisseurService } from "../../../services/fournisseur.service";
import { useDisclosure } from "@mantine/hooks";
import { ActionIcon, Button, Drawer, LoadingOverlay,Select,TextInput} from "@mantine/core";
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
import { CategoriesFournisseurService } from "../../../services/categoriesfournisseur.service";
import { BanqueService } from "../../../services/banque.service";

const schema = yup.object().shape({
  categorie: yup.string().required('Invalide categorie'),
  denomination: yup.string().required('Denomination invalide'),
  domiciliation: yup.string().required('Banque est requis'),
  compte_bancaire: yup.string().required('Compte bancaire est requis'),
  telephone: yup.string().required('telephone est requis'),
  ninea: yup.string().required('NINEA est requise'),
  registre_de_commerce: yup.string().required('Registre de commerce est requis'),
  adresse: yup.string()
});


function Fournisseurs() {

const [opened, { open, close }] = useDisclosure(false);
const [openedU, { open:openU, close:closeU }] = useDisclosure(false);
const { message } = App.useApp();
const key = 'get_fournisseurs';
const keyCat = 'get_categries_fournisseur';
const keyBan = 'get_banques';
const fournisseurService = new FournisseurService();
const categoriesFournisseurService = new CategoriesFournisseurService();
const banqueService = new BanqueService();
const qc = useQueryClient();
const {data,isLoading} = useQuery(key,() => fournisseurService.getAll());
const {data:categories,isLoading:isLoadingCat} = useQuery(keyCat,() => categoriesFournisseurService.getAll());
const {data:banques,isLoading:isLoadingBan} = useQuery(keyBan,() => banqueService.getAll());
const form = useForm({
    initialValues: {
  categorie: '',
  denomination: '',
  domiciliation: '',
  compte_bancaire: '',
  telephone: '',
  ninea: '',
  registre_de_commerce: '',
  adresse: ''
    },
    validate: yupResolver(schema),
  });
  const formU = useForm({
    initialValues: {
    _id:'',
    categorie: '',
    denomination: '',
    domiciliation: '',
    compte_bancaire: '',
    telephone: '',
    ninea: '',
    registre_de_commerce: '',
    adresse: ''
    },
    validate: yupResolver(schema),
  });

const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    denomination: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
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
 
const {mutate:createCompte,isLoading:loadingCreate} = useMutation((data) => fournisseurService.create(data),{
    onSuccess:(_) => {
        message.success("Le fournisseur a été ajouté avec succès");
        close();
        qc.invalidateQueries(key);
        form.reset();
    },
    onError:(_) => {
    message.error("Impossible d'ajouter le fournisseur");
    }
});

const {mutate:updateCompte,isLoading:loadingU} = useMutation((data: any) => fournisseurService.update(data.id, data.data),{
    onSuccess:(_) => {
        message.success("Le fournisseur a été ajouté avec succès");
        closeU();
        qc.invalidateQueries(key);
    },
    onError:(_) => {
    message.error("Impossible d'ajouter la fournisseur");
    }
});

const {mutate:deleteCompte,isLoading:loadingDelete} = useMutation((id:string) => fournisseurService.delete(id),{
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
    deleteCompte(id)
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
    </div>;
    
}

const onCreate = (values:any) => {
    createCompte(values);
}
const onUpdate = (values:any) => {
    const {_id,createdAt,updatedAt,__v,...rest} = values;
    updateCompte({id: _id,data: rest });
}

const handleUpdate  = (data: any) => {
   const {categorie,domiciliation} = data;
    formU.setValues({...data,categorie: categorie._id,domiciliation: domiciliation._id});
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
    <div className="my5 p-2 text-2xl font-semibold flex">GESTION  DES FOURNISSEURS</div>
   <Toolbar className="mb-4" left={leftToolbarTemplate}></Toolbar>
   <DataTable value={data} paginator rows={10} size="small" stripedRows filters={filters} rowsPerPageOptions={[5, 10, 25, 50]} loading={isLoading} tableStyle={{ minWidth: '50rem' }}
    globalFilterFields={['denomination']} header={header}>
    <Column field="denomination" header="DENOMINATION" style={{ width: '25%' }}></Column>
    <Column field="telephone" header="TELEPHONE" style={{ width: '25%' }}></Column>
    <Column field="ninea" header="NINEA" style={{ width: '25%' }}></Column>
   <Column headerStyle={{ width: '4rem', textAlign: 'center' }} bodyStyle={{ textAlign: 'center', overflow: 'visible' }} body={actionBodyTemplate} />
</DataTable>
   <Drawer opened={opened} onClose={close} title="CREATION  DE FOURNISSEUR">
   <LoadingOverlay
         visible={loadingCreate || isLoadingCat || isLoadingBan }
         zIndex={1000}
         overlayProps={{ radius: 'sm', blur: 2 }}
         loaderProps={{ color: 'blue', type: 'bars' }}
       />
     <form onSubmit={form.onSubmit(onCreate)}>
     <TextInput
         withAsterisk
         label="DENOMINATION"
         {...form.getInputProps('denomination')}
       />
       <Select
        withAsterisk
        label="CATEGORIE"
        {...form.getInputProps('categorie')}
        data={categories?.map((c:any) => ({label:c.libelle,value:c._id}))}
       />
       <Select
        withAsterisk
        label="DOMICILIATION"
        {...form.getInputProps('domiciliation')}
        data={banques?.map((c:any) => ({label:c.libelle,value:c._id}))}
       />
       <TextInput
         withAsterisk
         label="COMPTE BANCAIRE"
         {...form.getInputProps('compte_bancaire')}
       />
       <TextInput
         withAsterisk
         label="TELEPHONE"
         {...form.getInputProps('telephone')}
       />
       <TextInput
         withAsterisk
         label="NINEA"
         {...form.getInputProps('ninea')}
       />
       <TextInput
         withAsterisk
         label="REGISTRE DE COMMERCE"
         {...form.getInputProps('registre_de_commerce')}
       />
       <TextInput
         withAsterisk
         label="ADRESSE"
         {...form.getInputProps('adresse')}
       />
       <div className="my-5">
           <Button type="submit">SAUVEGARDER</Button>
       </div>
       
     </form>
   </Drawer>

   <Drawer position="right" opened={openedU} onClose={closeU} title="MODIFICATION  DE FOURNISSEUR">
   <LoadingOverlay
         visible={loadingU || isLoadingCat || isLoadingBan}
         zIndex={1000}
         overlayProps={{ radius: 'sm', blur: 2 }}
         loaderProps={{ color: 'blue', type: 'bars' }}
       />
     <form onSubmit={formU.onSubmit(onUpdate)}>
     <TextInput
         withAsterisk
         label="DENOMINATION"
         {...formU.getInputProps('denomination')}
       />
       <Select
        withAsterisk
        label="CATEGORIE"
        {...formU.getInputProps('categorie')}
        data={categories?.map((c:any) => ({label:c.libelle,value:c._id}))}
       />
       <Select
        withAsterisk
        label="DOMICILIATION"
        {...formU.getInputProps('domiciliation')}
        data={banques?.map((c:any) => ({label:c.libelle,value:c._id}))}
       />
       <TextInput
         withAsterisk
         label="COMPTE BANCAIRE"
         {...formU.getInputProps('compte_bancaire')}
       />
       <TextInput
         withAsterisk
         label="TELEPHONE"
         {...formU.getInputProps('telephone')}
       />
       <TextInput
         withAsterisk
         label="NINEA"
         {...formU.getInputProps('ninea')}
       />
       <TextInput
         withAsterisk
         label="REGISTRE DE COMMERCE"
         {...formU.getInputProps('registre_de_commerce')}
       />
       <TextInput
         withAsterisk
         label="ADRESSE"
         {...formU.getInputProps('adresse')}
       />
       <div className="my-5">
           <Button type="submit">MODIFIER</Button>
       </div>
       
     </form>
   </Drawer>
   </>
  )
}

export default Fournisseurs