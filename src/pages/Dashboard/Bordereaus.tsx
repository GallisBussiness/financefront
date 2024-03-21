import { useMutation, useQuery, useQueryClient } from "react-query";
import { BordereauService } from "../../services/bordereau.service";
import { useDisclosure } from "@mantine/hooks";
import { ActionIcon, Button, Drawer, LoadingOverlay,TextInput} from "@mantine/core";
import { DateInput } from "@mantine/dates";
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
import { FaFilePdf, FaSearch, FaTrash } from "react-icons/fa";
import { BudgetService } from "../../services/budget.service";
import {fr} from "date-fns/locale/fr"
import "dayjs/locale/fr"
import { format, isBefore, parseISO } from "date-fns";
import pdfMake from "pdfmake/build/pdfmake";
import {font} from "../../vfs_fonts";
import { logo } from "./logo";
import { drapeau } from "./drapeau";
pdfMake.vfs = font;
import { ToWords } from 'to-words';
import { EtatEngagement } from "../../acl/Ability";
import { Can } from "../../acl/Can";
import { useAppStore } from "../../common/Loader/store";

const toWords = new ToWords({
  localeCode: 'fr-FR',
  converterOptions: {
    currency: false,
    ignoreDecimal: false,
    ignoreZeroCurrency: false,
    doNotAddOnly: false,
    },
});

const formatNumber = (n: number) => String(n).replace(/(.)(?=(\d{3})+$)/g,'$1 ');

const schema = yup.object().shape({
    nom: yup.string().required('Invalide Nom'),
    date: yup.date().required('invalide date')
  });

function Bordereaus() {

const [opened, { open, close }] = useDisclosure(false);
const [openedU, { open:openU, close:closeU }] = useDisclosure(false);
const { message } = App.useApp();
const { role } = useAppStore() as any;
const key = 'get_bordereaus';
const keyB = 'get_active_budget';
const bordereauService = new BordereauService();
const budgetService = new BudgetService();
const qc = useQueryClient();
const {data,isLoading} = useQuery(key,() => bordereauService.getAll());
const {data:budget} = useQuery(keyB,() => budgetService.findActive());
const form = useForm({
    initialValues: {
        nom: '',
        date: new Date()
    },
    validate: yupResolver(schema),
  });
  const formU = useForm({
    initialValues: {
    _id:'', 
    nom: '',
    date: ''
    },
    validate: yupResolver(schema),
  });

const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    nom: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
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
 
const {mutate:createBordereau,isLoading:loadingCreate} = useMutation((data) => bordereauService.create(data),{
    onSuccess:(_) => {
        message.success("Le bordereau a été ajouté avec succès");
        close();
        qc.invalidateQueries(key);
    },
    onError:(_) => {
    message.error("Impossible d'ajouter le bordereau");
    }
});

const {mutate:updateBordereau,isLoading:loadingU} = useMutation((data: any) => bordereauService.update(data.id, data.data),{
    onSuccess:(_) => {
        message.success("Le bordereau a été modifié avec succès");
        closeU();
        qc.invalidateQueries(key);
    },
    onError:(_) => {
    message.error("Impossible d'ajouter la bordereau");
    }
});

const {mutate:deleteBordereau,isLoading:loadingDelete} = useMutation((id:string) => bordereauService.delete(id),{
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
    deleteBordereau(id)
  };
  
  const cancel = () => {
    message.info("L'action a été annulé !");
  };


const leftToolbarTemplate = () => {
    return (
      <Can I={role} a="CREATE_BORDEREAU">
         <div className="flex flex-wrap">
           <Button onClick={open}>NOUVEAU</Button>
        </div>
        </Can>

    );
};

const generateBordereau = (row:any) => {
  const vOrP = row.engagements.filter((r:any) => r.etat === EtatEngagement.PAYE || r.etat === EtatEngagement.VALIDE)
  const totalMontant = vOrP.reduce((acc: any,cur: any) => acc + cur.montant,0);
  const lastb = data.filter((b:any) => isBefore(b.date,row.date));
  let tc = 0;
  lastb.forEach((lb:any) => {
    const t = lb.engagements.reduce((acc: any,cur: any) => acc + cur.montant,0);
    tc += t;
  })
  const docDefinition:any = {
    pageOrientation: 'landscape',
    styles: {
      entete: {
          bold: true,
          alignment:'center',
          fontSize:10
      },
      center: {
          alignment:'center',
          fontSize:8,
          bold:true
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
        fontSize:6,
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
          fontSize:6,
          fillColor:'#73BFBA',
          alignment:'center'
      },
      anotherStyle: {
        italics: true,
        alignment: 'right'
      }
    },
    content:[{
      columnGap: 300,
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
            {image:logo,width: 80,alignment:"center"},
            {text:`BUDGET : ${row?.budget.annee}`,fontSize: 10,bold: true,margin:[0,2],alignment:"center"},
            {text:`DATE : ${format(row?.date,'dd/MM/yyyy')}`,fontSize: 10,bold: true,alignment:"center"},
          ]
          
        }
      ]
    },
    {
      margin: [150,10],
      fillColor:"#8E44AD",
      alignment:'center',
      layout:'noBorders',
      table: {
        widths: [500],
        body: [
          [ {text:` BORDEREAU DES MANDATS EMIS N° ${row?.numero}`,fontSize: 16,bold: true,color:'white',margin:[0,4]}],
        ]
      }
    },
    {text:"TRANSMIS A MONSIEUR L'AGENT COMPTABLE\n",fontSize: 12,bold: true,alignment:"center",color:"#8E44AD"},
    {
      margin: [10,10,10,10],
      alignment: 'justify',
      layout: {
        fillColor: function (rowIndex:number, node:any, columnIndex:number) {
          return (rowIndex === 0) ? 'beige' : null;
        }
      },
      table: {
        widths: ['17%', '10%','10%','25%','28%','10%'],
          body: [
              [{text:'N° DES MANDATS',style:'entete'}, {text:'ETAT',style:'entete'}, {text:'COMPTE',style:'entete'},{text:'BENEFICIAIRES',style:'entete'},{text:'OBJET DU MANDAT',style:'entete'},{text:'MONTANT',style:'entete'}],
             ...vOrP.map((e:any) => ([{text:e.numero, style:'center'},{text:e.etat,style:'center'},{text:e.credit.souscompte.code,style:'center'},{text:e?.beneficiaire ? e?.beneficiaire : e?.fournisseur?.denomination,style:'center'},{text:e?.objet,style:'center'},{text:formatNumber(e.montant),style:'nombre'}])),
             [{text:"MONTANT",colSpan:5,alignment:'center'},'','','','',{text:`${formatNumber(totalMontant)}`,fillColor:'beige',style:'nombre'}]
          ],
      }
  },
  {text:`Arrété le présent bordereau à la somme de : \n${toWords.convert(totalMontant)} francs CFA`,fontSize: 12,bold: true,alignment:"center",color:"#8E44AD"},
  {
    margin:[0,20,0,5],
    alignment: 'justify',
    columns: [
      {
        text: 'TOTAL PRESENT BORDEREAU',
        background:'beige',
      },
      {
        text: `${formatNumber(totalMontant)} FCFA`,
        background:'beige',
      }
    ]
  },
  {
    margin:[0,5],
    alignment: 'justify',
    columns: [
      {
        text: 'TOTAL EMISSIONS ANTERIEURES',
        background:'beige',
      },
      {
        text: `${formatNumber(tc)} FCFA`,
        background:'beige',
      }
    ]
  },
  {
    margin:[0,5],
    alignment: 'justify',
    columns: [
      {
        text: 'TOTAL CUMULES',
        background:'beige',
      },
      {
        text: `${formatNumber(totalMontant + tc)} FCFA`,
        background:'beige',
      }
    ]
  },
  {text:`NB: Les bordereaux ne tiennent en compte que les mandats qui sont validés par le directeur ou payés par l'ACP !`,fontSize: 8,bold: true,italics:true,alignment:"left",margin:[0,10]},
  {text:`LE DIRECTEUR`,fontSize: 14,bold: true,alignment:"right",margin:[0,10,100,0]},
  ]
  }
  
    pdfMake.createPdf(docDefinition).open();
  }



const actionBodyTemplate = (rowData: any) => {
    return <div className="flex items-center justify-center space-x-1">
     <ActionIcon type="button" onClick={() => generateBordereau(rowData)} bg="green">
    <FaFilePdf className="text-white"/>
    </ActionIcon>
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
    createBordereau({...values,budget: budget?._id});
}
const onUpdate = (values:any) => {
    const {_id,createdAt,updatedAt,__v,...rest} = values;
    updateBordereau({id: _id,data: rest });
}

const handleUpdate  = (data: any) => {
  const {date} = data;
  const nd = parseISO(date)
  formU.setValues({...data,date: nd,budget: budget?._id});
  openU();
}



const dateTemplate = (row: any) =>  format(parseISO(row.date), 'dd/MM/yyyy',{locale:fr}) ;

  return (
    <>
    <LoadingOverlay
         visible={loadingDelete}
         zIndex={1000}
         overlayProps={{ radius: 'sm', blur: 2 }}
         loaderProps={{ color: 'blue', type: 'bars' }}
       />
    <div className="p-2 text-2xl font-semibold flex">GESTION  DES BORDEREAUX</div>
   <Toolbar left={leftToolbarTemplate}></Toolbar>
   <DataTable value={data} paginator size="small" rows={10} stripedRows filters={filters} rowsPerPageOptions={[5, 10, 25, 50]} loading={isLoading} tableStyle={{ minWidth: '50rem' }}
    globalFilterFields={['numero','nom']} header={header}>
    <Column field="numero" header="NUMERO" style={{ width: '15%' }}></Column>
    <Column field="nom" header="NOM" style={{ width: '45%' }}></Column>
    <Column field="date" header="DATE" body={dateTemplate} style={{ width: '5%' }}></Column>
   <Column headerStyle={{ width: '4rem', textAlign: 'center' }} bodyStyle={{ textAlign: 'center', overflow: 'visible' }} body={actionBodyTemplate} />
</DataTable>
   <Drawer opened={opened} onClose={close} title="CREATION  DE BORDEREAU">
   <LoadingOverlay
         visible={loadingCreate}
         zIndex={1000}
         overlayProps={{ radius: 'sm', blur: 2 }}
         loaderProps={{ color: 'blue', type: 'bars' }}
       />
     <form onSubmit={form.onSubmit(onCreate)}>
        <TextInput
         withAsterisk
         label="NOM"
         {...form.getInputProps('nom')}
        />
        <DateInput
       withAsterisk
       label="DATE"
       locale="fr"
       {...form.getInputProps('date')}
      />
       <div className="my-5">
           <Button type="submit">SAUVEGARDER</Button>
       </div>
       
     </form>
   </Drawer>

   <Drawer position="right" opened={openedU} onClose={closeU} title="MODIFICATION  DE BORDEREAU">
   <LoadingOverlay
         visible={loadingU}
         zIndex={1000}
         overlayProps={{ radius: 'sm', blur: 2 }}
         loaderProps={{ color: 'blue', type: 'bars' }}
       />
     <form onSubmit={formU.onSubmit(onUpdate)}>
     <TextInput
         withAsterisk
         label="NOM"
         {...formU.getInputProps('nom')}
        />
        <DateInput
       withAsterisk
       label="DATE"
       locale="fr"
       {...formU.getInputProps('date')}
      />
       <div className="my-5">
           <Button type="submit">MODIFIER</Button>
       </div>
       
     </form>
   </Drawer>
   </>
  )
}

export default Bordereaus