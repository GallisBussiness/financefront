import { useMutation, useQuery, useQueryClient } from "react-query";
import { useDisclosure } from "@mantine/hooks";
import { ActionIcon, Button, Drawer, LoadingOverlay,NumberInput,Select,TextInput} from "@mantine/core";
import { DateInput, DatePickerInput } from "@mantine/dates";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Toolbar } from "primereact/toolbar";
import { useForm } from "@mantine/form";
import { yupResolver } from 'mantine-form-yup-resolver';
import * as yup from 'yup';
import { App, Modal, Popconfirm } from "antd";
import { BsFillPenFill } from 'react-icons/bs'
import { useState } from "react";
import { FilterMatchMode } from "primereact/api";
import { FaFileDownload, FaFolder, FaSearch, FaTrash } from "react-icons/fa";
import {fr} from "date-fns/locale/fr"
import "dayjs/locale/fr"
import { format, isWithinInterval, parseISO } from "date-fns";
import { CreditService } from "../services/credit.service";
import { VersementService } from "../services/versement.service";
import { useNavigate } from "react-router-dom";
import { CLASSE } from "../services/classe.service";

import { ToWords } from 'to-words';
import pdfMake from "pdfmake/build/pdfmake";
import {font} from "../vfs_fonts";
pdfMake.vfs = font;
import { drapeau } from "./Dashboard/drapeau";
import { logo } from "./Dashboard/logo";
import { EtatEngagement } from "../acl/Ability";
import { Can } from "../acl/Can";
import { useAppStore } from "../common/Loader/store";

const formatNumber = (n: number) => String(n).replace(/(.)(?=(\d{3})+$)/g,'$1 ');

const toWords = new ToWords({
  localeCode: 'fr-FR',
  converterOptions: {
    currency: false,
    ignoreDecimal: false,
    ignoreZeroCurrency: false,
    doNotAddOnly: false,
    },
});

const schema = yup.object().shape({
    numero: yup.string().required('Numero Invalide'),
    date: yup.date().required('invalide date'),
    partie_versante: yup.string().required('Numero Invalide'),
    montant: yup.number().required("Le Montant est requis"),
    credit: yup.string().required("Le credit est obligatoire")
  });


  const schema2 = yup.object().shape({
    range: yup.array().required('Invalid range'),
    credit: yup.string().required('Versement Invalide')
  });

function Versements() {

const [opened, { open, close }] = useDisclosure(false);
const [openedU, { open:openU, close:closeU }] = useDisclosure(false);
const [isModalOpen, setIsModalOpen] = useState(false);
const { message } = App.useApp();
const { role } = useAppStore() as any;
const navigate = useNavigate()
const key = 'get_versements';
const keyC = 'get_credits';
const versementService = new VersementService();
const creditService = new CreditService();
const qc = useQueryClient();
const {data,isLoading} = useQuery(key,() => versementService.getAll());
const {data:credits} = useQuery(keyC,() => creditService.getAll());
const formR = useForm({
  initialValues:{
   range:[],
   credit: '',
  },
  validate: yupResolver(schema2),
});

const showModal = () => {
  setIsModalOpen(true);
};


const handleCancel = () => {
  setIsModalOpen(false);
};
const form = useForm({
    initialValues: {
    numero: '',
    date: new Date(),
    partie_versante: '',
    montant: 0,
    credit: ''
    },
    validate: yupResolver(schema),
  });
  const formU = useForm({
    initialValues: {
    _id:'', 
    numero: '',
    date: '',
    partie_versante: '',
    montant: 0,
    credit: ''
    },
    validate: yupResolver(schema),
  });

const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    numero: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
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
 
const {mutate:createVersement,isLoading:loadingCreate} = useMutation((data) => versementService.create(data),{
    onSuccess:(_) => {
        message.success("Le versement a été ajouté avec succès");
        close();
        qc.invalidateQueries(key);
    },
    onError:(_) => {
    message.error("Impossible d'ajouter le versement");
    }
});

const {mutate:updateVersement,isLoading:loadingU} = useMutation((data: any) => versementService.update(data.id, data.data),{
    onSuccess:(_) => {
        message.success("Le versement a été modifié avec succès");
        closeU();
        qc.invalidateQueries(key);
    },
    onError:(_) => {
    message.error("Impossible d'ajouter la versement");
    }
});

const {mutate:deleteVersement,isLoading:loadingDelete} = useMutation((id:string) => versementService.delete(id),{
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
    deleteVersement(id)
  };
  
  const cancel = () => {
    message.info("L'action a été annulé !");
  };


const leftToolbarTemplate = () => {
    return (
      <Can I={role} a="CREATE_ENGAGEMENT">
        <div className="flex flex-wrap">
           <Button onClick={open}>NOUVEAU</Button>
        </div>
      </Can>
        
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
    <ActionIcon type="button" bg="green"  onClick={() => navigate(rowData._id)}>
        <FaFolder className="text-white"/>
        </ActionIcon>
    </div>;
    
}

const onCreate = (values:any) => {
    createVersement({...values});
}
const onUpdate = (values:any) => {
    const {_id,createdAt,updatedAt,__v,...rest} = values;
    updateVersement({id: _id,data: rest });
}

const handleUpdate  = (data: any) => {
  const {date,credit} = data;
  const nd = parseISO(date)
  formU.setValues({...data,date: nd,credit: credit?._id});
  openU();
}


const dateTemplate = (row: any) =>  format(parseISO(row.date), 'dd/MM/yyyy',{locale:fr}) ;
// const etatTemplate = (row:any) =>  <Badge.Ribbon text={row.etat} color={StateMatch[data.etat].color}> <div>et</div></Badge.Ribbon>

const generateOrdreDeRecette = () => {
  if(formR.isValid()){
  const {range,credit} = formR.values;
  const cr = credits.find((c:any)=> c._id === credit);
  const versements  = data?.filter((v:any) => v.credit._id === credit).filter((r:any) => r.etat === EtatEngagement.VALIDE).filter((r:any) => isWithinInterval(r.date, {
    start: range[0],
    end: range[1]
  }));
  const montantTotal = versements?.reduce((acc:any,cur:any) => acc  + cur.montant ,0 );
  const docDefinition:any = {
    styles: {
      entete: {
          bold: true,
          alignment:'center',
          fontSize:12
      },
      center: {
          alignment:'center',
      },
      left: {
        alignment:'left',
    },
    right: {
      alignment:'right',
  },
      nombre: {
        alignment:'right',
        fontSize:10,
        bold: true
    },
    info: {
      bold: true,
      fontSize:10,
  },
      header3: {
          color:"white",
          fillColor: '#73BFBA',
          bold: true,
          alignment:'center',
          fontSize:6,
      },
      header4: {
        color:"white",
        fillColor: '#73BFBA',
        bold: true,
        alignment:'right',
        fontSize:6
    },
      total:{
          color:"white",
          bold: true,
          fontSize:14,
          fillColor:'#73BFBA',
          alignment:'center'
      },
      anotherStyle: {
        italics: true,
        alignment: 'right'
      }
    },
    content:[{
      columnGap: 100,
      columns: [
        {
        with: 'auto',
        alignment:'left',
        stack: [
          {text:"REPUBLIQUE DU SENEGAL\n",fontSize: 10,bold: true,alignment:"center"},
          {text:"Un Peuple, Un but, Une Foi\n",fontSize: 10,bold: true,margin:[0,2],alignment:"center"},
          {image:drapeau,width: 40,alignment:"center"},
          {text:"MINISTERE DE L'ENSEIGNEMENT SUPERIEUR DE LA RECHERCHE ET DE L'INNOVATION \n",fontSize: 10,bold: true,margin:[0,2],alignment:"center"},
          {text:"CENTRE REGIONAL DES OEUVRES UNIVERSITAIRES SOCIALES DE ZIGUINCHOR\n",fontSize: 10,bold: true,margin:[0,2],alignment:"center"},
          {text:"DIVISION DES AFFAIRES FINANCIERS",fontSize: 10,bold: true,alignment:"center"}
        ]},
        
        {
          with:'auto',
          alignment:'right',
          stack:[
            {image:logo,width: 80,alignment:"right"},
            {text:`EXERCICE : 2024`,fontSize: 10,bold: true,margin:[0,2],alignment:"right"},
          ]
          
        }
      ]
    },
    {
      margin: [0,10],
      fillColor:"#8E44AD",
      alignment:'center',
      layout:'noBorders',
      table: {
        widths: ['100%'],
        body: [
          [ {text:`ORDRE DE RECETTE`,fontSize: 16,bold: true,color:'white',margin:[0,4]}],
        ]
      }
    },
    {text:`PERIODE DU : ${format(range[0],'dd MMMM',{locale:fr})} au ${format(range[1],'dd MMMM yyyy',{locale:fr})}`,fontSize: 10,bold: true,margin:[0,4], alignment:'right'},
    {text:`Compte principal : ${cr?.souscompte.compte_divisionnaire.compte.code} | ${cr?.souscompte.compte_divisionnaire.compte.libelle}`,fontSize: 12,bold: true,margin:[0,4], alignment:'right'},
    {text:`Compte Divisionnaire : ${cr?.souscompte.compte_divisionnaire.code} | ${cr?.souscompte.compte_divisionnaire.libelle}`,fontSize: 12,bold: true,margin:[0,4], alignment:'right'},
    {text:`Compte budgétaire  : ${cr?.souscompte.code} | ${cr?.souscompte.libelle}`,fontSize: 12,bold: true,margin:[0,4], alignment:'right'},
    {
      margin: [0,10,0,5],
      alignment: 'justify',
      layout: {
        fillColor: function (rowIndex:number, node:any, columnIndex:number) {
          return (rowIndex === 0) ? 'beige' : null;
        }
      },
      table: {
        widths: ['10%', '15%','20%','40%','15%'],
          body: [
              [{text:'N°:',style:'entete'},
               {text:'Date',style:'entete'},
               {text:'Débiteurs',style:'entete'},
               {text:'Nature',style:'entete'},
               {text:'Montant',style:'entete'},
              ],
              ...versements?.map((p:any) => (
                [{text:`${p.numero}`,style:'info',alignment:'center'},
                 {text:`${format(p.date,'dd/MM/yyyy')}`,style:'info'},
                 {text:`${p.partie_versante}`,style:'info'},
                 {text:`${p.credit.souscompte.libelle}`,style:'info'},
                 {text:`${formatNumber(p.montant)}`,style:'info',alignment:'right'},
               ]
            )),
            [{text:'Total',colSpan:4,style:'total',alignment:'center'},'','','',{text:`${formatNumber(montantTotal)}`,style:'total',alignment:'right'}],
          ]
  }},
  {
    svg: '<svg height="2" width="600" xmlns="http://www.w3.org/2000/svg"><line x1="0" y1="0" x2="600" y2="0" style="stroke:black;stroke-width:2" /></svg>',
    width: 600
  },
  {text:`L'agent comptable est invité à recevoir du sus dénommé la somme de : `,fontSize: 12,bold: true},
  {text:`${toWords.convert(montantTotal)} FCFA (${formatNumber(montantTotal)})`,fontSize: 12,bold: true,alignment:'center',margin:[0,10,0,10]},
  {text:`LE DIRECTEUR`,fontSize: 14,bold: true,alignment:"right",margin:[10,20]},
    ]};
    handleCancel();
    formR.reset();
    pdfMake.createPdf(docDefinition).open();
  }
  else {
    message.error('Le formulaire est invalide !')
  }
}

  return (
    <>
    <LoadingOverlay
         visible={loadingDelete}
         zIndex={1000}
         overlayProps={{ radius: 'sm', blur: 2 }}
         loaderProps={{ color: 'blue', type: 'bars' }}
       />
           <Button className="w-full mx-2 my-2" bg="green" leftSection={<FaFileDownload />} onClick={showModal}>GENERER ORDRE DE RECETTE</Button>
    <div className="p-2 text-2xl font-semibold flex">GESTION  DES VERSEMENTS</div>
   <Toolbar left={leftToolbarTemplate}></Toolbar>
   <DataTable value={data} paginator size="small" rows={10} stripedRows filters={filters} rowsPerPageOptions={[5, 10, 25, 50]} loading={isLoading} tableStyle={{ minWidth: '50rem' }}
    globalFilterFields={['numero']} header={header}>
    <Column field="numero" header="NUMERO" style={{ width: '15%' }}></Column>
    <Column field="date" header="DATE" body={dateTemplate} style={{ width: '5%' }}></Column>
    <Column field="montant" header="MONTANT"body={(row) => formatNumber(row.montant)} style={{ width: '15%' }} pt={{
            bodyCell:{ className:"text-right"}
        }}></Column>
    <Column field="partie_versante" header="PARTIE VERSANTE" style={{ width: '45%' }}></Column>
    <Column field="etat" header="ETAT"  style={{ width: '5%' }}></Column>
   <Column headerStyle={{ width: '4rem', textAlign: 'center' }} bodyStyle={{ textAlign: 'center', overflow: 'visible' }} body={actionBodyTemplate} />
</DataTable>
   <Drawer opened={opened} onClose={close} title="CREATION  DE VERSEMENT">
   <LoadingOverlay
         visible={loadingCreate}
         zIndex={1000}
         overlayProps={{ radius: 'sm', blur: 2 }}
         loaderProps={{ color: 'blue', type: 'bars' }}
       />
     <form onSubmit={form.onSubmit(onCreate)}>
        <TextInput
         withAsterisk
         label="NUMERO"
         {...form.getInputProps('numero')}
        />
        <DateInput
       withAsterisk
       label="DATE"
       locale="fr"
       {...form.getInputProps('date')}
      />
      <TextInput
         withAsterisk
         label="PARTIE VERSANTE"
         {...form.getInputProps('partie_versante')}
        />
        <NumberInput
         withAsterisk
         label="MONTANT"
         {...form.getInputProps('montant')}
        />
        <Select
        withAsterisk
        searchable
        label="CREDIT"
        {...form.getInputProps('credit')}
        data={credits?.filter((r:any) => {
          const c = r.souscompte.compte_divisionnaire.compte.classe;
           return (c === CLASSE.PRODUIT_DE_FONCTIONNEMENT) || (c === CLASSE.PRODUIT_INVESTISSEMENT)
        }).map((c:any) => ({label:`${c?.souscompte?.code} | ${c?.souscompte?.libelle}`,value:c._id}))}
       />
       <div className="my-5">
           <Button type="submit">SAUVEGARDER</Button>
       </div>
       
     </form>
   </Drawer>

   <Drawer position="right" opened={openedU} onClose={closeU} title="MODIFICATION  DE VERSEMENT">
   <LoadingOverlay
         visible={loadingU}
         zIndex={1000}
         overlayProps={{ radius: 'sm', blur: 2 }}
         loaderProps={{ color: 'blue', type: 'bars' }}
       />
     <form onSubmit={formU.onSubmit(onUpdate)}>
     <TextInput
         withAsterisk
         label="NUMERO"
         {...formU.getInputProps('numero')}
        />
        <DateInput
       withAsterisk
       label="DATE"
       locale="fr"
       {...formU.getInputProps('date')}
      />
      <TextInput
         withAsterisk
         label="PARTIE VERSANTE"
         {...formU.getInputProps('partie_versante')}
        />
        <NumberInput
         withAsterisk
         label="MONTANT"
         {...formU.getInputProps('montant')}
        />
        <Select
        withAsterisk
        searchable
        label="CREDIT"
        {...formU.getInputProps('credit')}
        data={credits?.filter((r:any) => {
          const c = r.souscompte.compte_divisionnaire.compte.classe;
           return (c === CLASSE.PRODUIT_DE_FONCTIONNEMENT) || (c === CLASSE.PRODUIT_INVESTISSEMENT)
        }).map((c:any) => ({label:`${c?.souscompte?.code} | ${c?.souscompte?.libelle}`,value:c._id}))}
       />
       <div className="my-5">
           <Button type="submit">MODIFIER</Button>
       </div>
       
     </form>
   </Drawer>
   <Modal title="ORDRE DE RECETTE" open={isModalOpen} okButtonProps={{className:"bg-blue-400"}} onOk={generateOrdreDeRecette} onCancel={handleCancel} zIndex={98}>
        <form onSubmit={(e) => e.preventDefault()}>
            <DatePickerInput
          type="range"
          label="LA PERIODE"
          placeholder="choisisser la periode"
         {...formR.getInputProps('range')}
         locale="fr"
        />
        <Select
        withAsterisk
        label="CREDIT"
        {...formR.getInputProps('credit')}
        data={credits?.filter((r:any) => {
          const c = r?.souscompte?.compte_divisionnaire.compte.classe;
           return (c === CLASSE.PRODUIT_DE_FONCTIONNEMENT) || (c === CLASSE.PRODUIT_INVESTISSEMENT)
        }).map((c:any) => ({label:c?.souscompte.libelle,value:c._id}))}
       />
        </form>
      </Modal>
   </>
  )
}

export default Versements