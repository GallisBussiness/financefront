import { useQuery } from "react-query";
import { BudgetService } from "../../services/budget.service";
import { Button, LoadingOverlay, TextInput } from "@mantine/core";
import { FaFileDownload, FaSearch } from "react-icons/fa";
import pdfMake from "pdfmake/build/pdfmake";
import {font} from "../../vfs_fonts";
pdfMake.vfs = font;
import { drapeau } from "./drapeau";
import { logo } from "./logo";
import {round} from "lodash";
import { CLASSE } from "../../services/classe.service";
import { useState } from "react";
import { EtatEngagement } from "../../acl/Ability";
import { format, isWithinInterval, parseISO } from "date-fns";
import { Toolbar } from "primereact/toolbar";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { FilterMatchMode } from "primereact/api";
import { Divider, Modal, Progress } from "antd";
import { useForm } from "@mantine/form";
import { yupResolver } from 'mantine-form-yup-resolver';
import * as yup from 'yup';
import { fr } from "date-fns/locale/fr";
import { DatePickerInput } from "@mantine/dates";
const formatNumber = (n: number) => String(n).replace(/(.)(?=(\d{3})+$)/g,'$1 ');


const schema = yup.object().shape({
    range: yup.array().required('Invalid range'),
  });

function Gestions() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [PRODUITS,setProduit] = useState([]);
    const [CHARGES,setCharges] = useState([]);
    const key = 'get_budgets';
    const form = useForm({
        initialValues:{
         range:[],
        },
        validate: yupResolver(schema),
      });

      const showModal = () => {
        setIsModalOpen(true);
      };
      
      
      const handleCancel = () => {
        setIsModalOpen(false);
      };
    const budgetService = new BudgetService(); 
    const {data,isLoading} = useQuery(key,() => budgetService.findAll(),{
        onSuccess:(_) => {
        setProduit(_.produits?.map((p:any) => (
            {compte:p.souscompte.code,
            libelle: p.souscompte.libelle,
            prevision: p.prevision,
            virementp: 0,
            virementm:0,
            autorisations:0,
            bd:p.prevision,
            realisations: p.versements.filter((e:any) => e.etat === EtatEngagement.VALIDE)?.reduce((acc:any,cur:any) => acc + cur.montant ,0),
        } )));
          setCharges(_.charges?.map((p:any) => (
              {compte:p.souscompte.code,
              libelle: p.souscompte.libelle,
              prevision: p.prevision,
              virementp: 0,
              virementm:0,
              autorisations:0,
              bd:p.prevision,
              realisations: p.engagements.filter((e:any) => e.etat === EtatEngagement.VALIDE || e.etat === EtatEngagement.PAYE).reduce((acc:any,cur:any) => acc + cur.montant ,0),
          } )));
  
        }
    });


    const [filtersP, setFiltersP] = useState({
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
        compte: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
    });
    const [globalFilterValueP, setGlobalFilterValueP] = useState('');
    
    const onGlobalFilterChangeP = (e: { target: { value: any; }; }) => {
        const value = e.target.value;
        let _filters = { ...filtersP };
    
        _filters['global'].value = value;
    
        setFiltersP(_filters);
        setGlobalFilterValueP(value);
    };

    const [filtersC, setFiltersC] = useState({
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
        compte: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
    });
    const [globalFilterValueC, setGlobalFilterValueC] = useState('');
    
    const onGlobalFilterChangeC = (e: { target: { value: any; }; }) => {
        const value = e.target.value;
        let _filters = { ...filtersC };
    
        _filters['global'].value = value;
    
        setFiltersC(_filters);
        setGlobalFilterValueC(value);
    };

    const renderHeaderP = () => {
        return (
            <div className="flex">
                    <TextInput value={globalFilterValueP} leftSection={<FaSearch/>} onChange={onGlobalFilterChangeP} placeholder="Rechercher..." />
            </div>
        );
    };
    const headerP = renderHeaderP();
    const renderHeaderC = () => {
        return (
            <div className="flex">
                    <TextInput value={globalFilterValueC} leftSection={<FaSearch/>} onChange={onGlobalFilterChangeC} placeholder="Rechercher..." />
            </div>
        );
    };
    const headerC = renderHeaderC();
    const generateRapport = () => {
        if(form.isValid()){
        const {range} = form.values;
        const PI =  data?.produits?.filter((d:any) => d.souscompte.compte_divisionnaire.compte.classe === CLASSE.PRODUIT_INVESTISSEMENT)
        .map((p:any) => (
            {compte:p.souscompte.code,
            libelle: p.souscompte.libelle,
            prevision: p.prevision,
            virementp: 0,
            virementm:0,
            autorisations:0,
            bd:p.prevision,
            realisations: p.versements.filter((e:any) => ((e.etat === EtatEngagement.VALIDE) && isWithinInterval(parseISO(e?.date), {
                start: range[0],
                end: range[1]
              })))?.reduce((acc:any,cur:any) => acc + cur.montant ,0),
        } ));
        const totauxPI =PI.reduce((acc:any,cur:any) => {
            acc.prevision += cur.prevision ;
            acc.virementp += cur.virementp ;
            acc.virementm += cur.virementm ;
            acc.autorisations += cur.autorisations ;
            acc.bd += cur.bd ;
            acc.realisations += cur.realisations ;
            return acc;
        } ,{prevision: 0,
            virementp: 0,
            virementm:0,
            autorisations:0,
            bd:0,
            realisations:0
        }) ?? {prevision: 0,
            virementp: 0,
            virementm:0,
            autorisations:0,
            bd:0,
            realisations:0
        };
        const CI = data?.charges?.filter((d:any) => d.souscompte.compte_divisionnaire.compte.classe === CLASSE.CHARGE_INVESTISSEMENT)
        .map((p:any) => (
            {compte:p.souscompte.code,
            libelle: p.souscompte.libelle,
            prevision: p.prevision,
            virementp: 0,
            virementm:0,
            autorisations:0,
            bd:p.prevision,
            realisations: p.engagements.filter((e:any) => (((e.etat === EtatEngagement.VALIDE) || (e.etat === EtatEngagement.PAYE)) && isWithinInterval(parseISO(e?.date), {
                start: range[0],
                end: range[1]
              }))).reduce((acc:any,cur:any) => acc + cur.montant ,0),
        } ));
        const totauxCI = CI.reduce((acc:any,cur:any) => {
            acc.prevision += cur.prevision ;
            acc.virementp += cur.virementp ;
            acc.virementm += cur.virementm ;
            acc.autorisations += cur.autorisations ;
            acc.bd += cur.bd ;
            acc.realisations += cur.realisations ;
            return acc;
        } ,{prevision: 0,
            virementp: 0,
            virementm:0,
            autorisations:0,
            bd:0,
            realisations:0
        }) ?? {prevision: 0,
            virementp: 0,
            virementm:0,
            autorisations:0,
            bd:0,
            realisations:0
        };
        const PF = data?.produits?.filter((d:any) => d.souscompte.compte_divisionnaire.compte.classe === CLASSE.PRODUIT_DE_FONCTIONNEMENT)
        .map((p:any) => (
            {compte:p.souscompte.code,
            libelle: p.souscompte.libelle,
            prevision: p.prevision,
            virementp: 0,
            virementm:0,
            autorisations:0,
            bd:p.prevision,
            realisations: p.versements.filter((e:any) => ((e.etat === EtatEngagement.VALIDE) && isWithinInterval(parseISO(e?.date), {
                start: range[0],
                end: range[1]
              })))?.reduce((acc:any,cur:any) => acc + cur.montant ,0),
        } ));
        const totauxPF =  PF.reduce((acc:any,cur:any) => {
            acc.prevision += cur.prevision ;
            acc.virementp += cur.virementp ;
            acc.virementm += cur.virementm ;
            acc.autorisations += cur.autorisations ;
            acc.bd += cur.bd ;
            acc.realisations += cur.realisations ;
            return acc;
        } ,{prevision: 0,
            virementp: 0,
            virementm:0,
            autorisations:0,
            bd:0,
            realisations:0
        }) ?? {prevision: 0,
            virementp: 0,
            virementm:0,
            autorisations:0,
            bd:0,
            realisations:0
        };

        const CF = data?.charges?.filter((d:any) => d.souscompte.compte_divisionnaire.compte.classe === CLASSE.CHARGE_DE_FONCTIONNEMENT)
        .map((p:any) => (
            {compte:p.souscompte.code,
            libelle: p.souscompte.libelle,
            prevision: p.prevision,
            virementp: 0,
            virementm:0,
            autorisations:0,
            bd:p.prevision,
            realisations:p.engagements.filter((e:any) => (((e.etat === EtatEngagement.VALIDE) || (e.etat === EtatEngagement.PAYE)) && isWithinInterval(parseISO(e?.date), {
                start: range[0],
                end: range[1]
              })))?.reduce((acc:any,cur:any) => acc + cur.montant ,0),
        } ));
        const totauxCF =  CF.reduce((acc:any,cur:any) => {
            acc.prevision += cur.prevision ;
            acc.virementp += cur.virementp ;
            acc.virementm += cur.virementm ;
            acc.autorisations += cur.autorisations ;
            acc.bd += cur.bd;
            acc.realisations += cur.realisations ;
            return acc;
        } ,{prevision: 0,
            virementp: 0,
            virementm:0,
            autorisations:0,
            bd:0,
            realisations:0
        })  ?? {prevision: 0,
            virementp: 0,
            virementm:0,
            autorisations:0,
            bd:0,
            realisations:0
        };
        const docDefinition:any = {
            pageOrientation:'landscape',
            styles: {
              entete: {
                  bold: true,
                  alignment:'center',
                  fillColor:'beige',
                  fontSize:8
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
                fontSize:8,
                alignment:'right',
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
                  bold: true,
                  fontSize:10,
                  fillColor:'#50d9eb',
                  alignment:'right'
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
                    {text:`COMPTE ADMINISTRATIF`,fontSize: 10,bold: true,margin:[0,2],alignment:"right"},
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
                  [ {text:`SITUATION D'EXECUTION DU ${format(range[0],'dd MMMM yyyy',{locale:fr})} AU ${format(range[1],'dd MMMM yyyy',{locale:fr})}`,fontSize: 14,bold: true,color:'white',margin:[0,4]}],
                ]
              }
            },
            {
                margin: [0,10,0,5],
                alignment: 'justify',
                layout: {
                    fillColor: function (rowIndex:number) {
                        return (rowIndex % 2 === 0) ? '#CCCCCC' : null;
                    }
                },
                table: {
                  widths: ['5%', '25%','10%','10%','6%','10%','10%','10%','10%','6%'],
                    body: [
                        [{text:'#compte',style:'entete'}, {text:'libelle',style:'entete'},
                         {text:'Prev. init.',style:'entete'},
                         {text:'Virements+',style:'entete'},
                         {text:'Virements-',style:'entete'},
                         {text:'Autorisations',style:'entete'},
                         {text:'Budget définitif',style:'entete'},
                         {text:'Réalisation',style:'entete'},
                         {text:'RAR',style:'entete'},
                         {text:'sTaux(%)',style:'entete'}
                        ],
                        ...PI.map((p:any) => (
                            [{text:`${p.compte}`,style:'info',alignment:'center'},
                             {text:`${formatNumber(p.libelle)}`,style:'info',alignment:'left'},
                             {text:`${formatNumber(p.prevision)}`,style:'info'},
                             {text:`${formatNumber(p.virementp)}`,style:'info'},
                             {text:`${formatNumber(p.virementm)}`,style:'info'},
                             {text:`${formatNumber(p.autorisations)}`,style:'info'},
                             {text:`${formatNumber(p.bd)}`,style:'info'},
                             {text:`${formatNumber(p.realisations)}`,style:'info'},
                             {text:`${formatNumber(p.bd - p.realisations)}`,style:'info'},
                             {text:`${round((p.realisations / p.bd) * 100,2)}`,style:'info'},
                           ]
                        )),
                        [
                        {text:'Total',colSpan:2,style:'total',alignment:'center'},
                        '',
                        {text:`${formatNumber(totauxPI.prevision)}`,style:'total'},
                        {text:`${formatNumber(totauxPI.virementp)}`,style:'total'},
                        {text:`${formatNumber(totauxPI.virementm)}`,style:'total'},
                        {text:`${formatNumber(totauxPI.autorisations)}`,style:'total'},
                        {text:`${formatNumber(totauxPI.bd)}`,style:'total'},
                        {text:`${formatNumber(totauxPI.realisations)}`,style:'total'},
                        {text:`${formatNumber(totauxPI.bd - totauxPI.realisations)}`,style:'total'},
                        {text:`${round(((totauxPI.realisations / totauxPI.bd)?? 0) * 100,2)}`,style:'total'},
                        ],
                        ...CI.map((p:any) => (
                            [{text:`${p.compte}`,style:'info',alignment:'center'},
                             {text:`${formatNumber(p.libelle)}`,style:'info', alignment: 'right'},
                             {text:`${formatNumber(p.prevision)}`,style:'info'},
                             {text:`${formatNumber(p.virementp)}`,style:'info'},
                             {text:`${formatNumber(p.virementm)}`,style:'info'},
                             {text:`${formatNumber(p.autorisations)}`,style:'info'},
                             {text:`${formatNumber(p.bd)}`,style:'info'},
                             {text:`${formatNumber(p.realisations)}`,style:'info'},
                             {text:`${formatNumber(p.bd - p.realisations)}`,style:'info'},
                             {text:`${round((p.realisations / p.bd) * 100,2)}`,style:'info'},
                           ]
                        )),
                        [
                        {text:'Total',colSpan:2,style:'total',alignment:'center'},
                        '',
                        {text:`${formatNumber(totauxCI.prevision)}`,style:'total'},
                        {text:`${formatNumber(totauxCI.virementp)}`,style:'total'},
                        {text:`${formatNumber(totauxCI.virementm)}`,style:'total'},
                        {text:`${formatNumber(totauxCI.autorisations)}`,style:'total'},
                        {text:`${formatNumber(totauxCI.bd)}`,style:'total'},
                        {text:`${formatNumber(totauxCI.realisations)}`,style:'total'},
                        {text:`${formatNumber(totauxCI.bd - totauxCI.realisations)}`,style:'total'},
                        {text:`${round(((totauxCI.realisations / totauxCI.bd) ?? 0) * 100,2)}`,style:'total'},
                        ],
                        ...CF.map((p:any) => (
                            [{text:`${p.compte}`,style:'info',alignment:'center'},
                             {text:`${formatNumber(p.libelle)}`,style:'info', alignment: 'right'},
                             {text:`${formatNumber(p.prevision)}`,style:'info'},
                             {text:`${formatNumber(p.virementp)}`,style:'info'},
                             {text:`${formatNumber(p.virementm)}`,style:'info'},
                             {text:`${formatNumber(p.autorisations)}`,style:'info'},
                             {text:`${formatNumber(p.bd)}`,style:'info'},
                             {text:`${formatNumber(p.realisations)}`,style:'info'},
                             {text:`${formatNumber(p.bd - p.realisations)}`,style:'info'},
                             {text:`${round((p.realisations / p.bd) * 100,2)}`,style:'info'},
                           ]
                        )),
                        [
                        {text:'Total',colSpan:2,style:'total',alignment:'center'},
                        '',
                        {text:`${formatNumber(totauxCF.prevision)}`,style:'total'},
                        {text:`${formatNumber(totauxCF.virementp)}`,style:'total'},
                        {text:`${formatNumber(totauxCF.virementm)}`,style:'total'},
                        {text:`${formatNumber(totauxCF.autorisations)}`,style:'total'},
                        {text:`${formatNumber(totauxCF.bd)}`,style:'total'},
                        {text:`${formatNumber(totauxCF.realisations)}`,style:'total'},
                        {text:`${formatNumber(totauxCF.bd - totauxCF.realisations)}`,style:'total'},
                        {text:`${round(((totauxCF.realisations / totauxCF.bd)?? 0) * 100,2)}`,style:'total'},
                        ],
                        ...PF.map((p:any) => (
                            [{text:`${p.compte}`,style:'info',alignment:'center'},
                             {text:`${formatNumber(p.libelle)}`,style:'info', alignment: 'right'},
                             {text:`${formatNumber(p.prevision)}`,style:'info'},
                             {text:`${formatNumber(p.virementp)}`,style:'info'},
                             {text:`${formatNumber(p.virementm)}`,style:'info'},
                             {text:`${formatNumber(p.autorisations)}`,style:'info'},
                             {text:`${formatNumber(p.bd)}`,style:'info'},
                             {text:`${formatNumber(p.realisations)}`,style:'info'},
                             {text:`${formatNumber(p.bd - p.realisations)}`,style:'info'},
                             {text:`${round((p.realisations / p.bd) * 100,2)}`,style:'info'},
                           ]
                        )),
                        [
                        {text:'Total',colSpan:2,style:'total',alignment:'center'},
                        '',
                        {text:`${formatNumber(totauxPF.prevision)}`,style:'total'},
                        {text:`${formatNumber(totauxPF.virementp)}`,style:'total'},
                        {text:`${formatNumber(totauxPF.virementm)}`,style:'total'},
                        {text:`${formatNumber(totauxPF.autorisations)}`,style:'total'},
                        {text:`${formatNumber(totauxPF.bd)}`,style:'total'},
                        {text:`${formatNumber(totauxPF.realisations)}`,style:'total'},
                        {text:`${formatNumber(totauxPF.bd - totauxPF.realisations)}`,style:'total'},
                        {text:`${round(((totauxPF.realisations / totauxPF.bd)?? 0) * 100,2)}`,style:'total'},
                        ],
                    ],
                }
            },
          ]
          }
          
            pdfMake.createPdf(docDefinition).open();
        }
    }

    const leftToolbarTemplateP = () => {
        return (
            <div className="flex flex-wrap">
               COMPTE ADMINISTRATIF DES CLASSES DE PRODUITS (1-7)
            </div>
        );
    };

    const leftToolbarTemplateC = () => {
        return (
            <div className="flex flex-wrap">
               COMPTE ADMINISTRATIF DES CLASSES DE CHARGES (2-6)
            </div>
        );
    };

    const soldeTemplate = (row:any) => formatNumber(row.bd - row.realisations);
    const executionTemplate = (row:any) => <Progress percent={round((row.realisations / row.bd) * 100,2)} size="small" />;

  return (
    <>
    <LoadingOverlay
         visible={isLoading}
         zIndex={1000}
         overlayProps={{ radius: 'sm', blur: 2 }}
         loaderProps={{ color: 'blue', type: 'bars' }}
       />
    <Button className="w-full mx-2 my-2" leftSection={<FaFileDownload />} onClick={showModal}>Telecharger le compte administratif</Button>
    <Toolbar left={leftToolbarTemplateP}></Toolbar>
   <DataTable value={PRODUITS} stripedRows paginator size="small" rows={10} filters={filtersP} header={headerP} rowsPerPageOptions={[5, 10, 25, 50]} loading={isLoading} tableStyle={{ minWidth: '50rem' }}
    globalFilterFields={['compte','libelle']} >
    <Column field="compte" header="CODE" style={{ width: '5%' }}></Column>
    <Column field="libelle" header="LIBELLE" style={{ width: '10%' }}></Column>
    <Column field="prevision" header="PREVISION" body={(row) => formatNumber(row.prevision)} style={{ width: '5%' }} pt={{
            bodyCell:{ className:"text-right"}
        }}></Column>
    <Column field="autorisations" header="AUTORISATIONS" style={{ width: '5%' }} pt={{
            bodyCell:{ className:"text-right"}
        }}></Column>
    <Column field="bd" header="MONTANT" body={(row) => formatNumber(row.bd)} style={{ width: '5%' }} pt={{
            bodyCell:{ className:"text-right"}
        }}></Column>
    <Column field="realisations" header="RECETTE" style={{ width: '5%' }} pt={{
            bodyCell:{ className:"text-right"}
        }}></Column>
    <Column field="solde" header="SOLDE" body={soldeTemplate} style={{ width: '5%' }} pt={{
            bodyCell:{ className:"text-right"}
        }}></Column>
    <Column field="execution" header="EXECUTION" body={executionTemplate} style={{ width: '5%' }}></Column>
</DataTable>
<Divider />
<Toolbar left={leftToolbarTemplateC}></Toolbar>
   <DataTable value={CHARGES} stripedRows paginator size="small" rows={10} filters={filtersC} header={headerC} rowsPerPageOptions={[5, 10, 25, 50]} loading={isLoading} tableStyle={{ minWidth: '50rem' }}
    globalFilterFields={['compte','libelle']} >
    <Column field="compte" header="CODE" style={{ width: '5%' }}></Column>
    <Column field="libelle" header="LIBELLE" style={{ width: '20%' }} ></Column>
    <Column field="prevision" header="PREVISION" sortable body={(row) => formatNumber(row.prevision)} style={{ width: '5%' }} pt={{
            bodyCell:{ className:"text-right"}
        }}></Column>
    <Column field="virementp" sortable header="Virement +" body={(row) => formatNumber(row.virementp)} style={{ width: '5%' }} pt={{
            bodyCell:{ className:"text-right"}
        }}></Column>
    <Column field="virementm" sortable header="Virement -" body={(row) => formatNumber(row.virementm)} style={{ width: '5%' }} pt={{
            bodyCell:{ className:"text-right"}
        }}></Column>
    <Column field="autorisations" header="AUTORISATIONS" style={{ width: '5%' }} pt={{
            bodyCell:{ className:"text-right"}
        }}></Column>
    <Column field="bd" header="MONTANT" body={(row) => formatNumber(row.bd)} style={{ width: '5%' }} pt={{
            bodyCell:{ className:"text-right"}
        }}></Column>
    <Column field="realisations" sortable header="ENGAGEMENTS" style={{ width: '5%' }} pt={{
            bodyCell:{ className:"text-right"}
        }}></Column>
    <Column field="solde" header="SOLDE"  body={soldeTemplate} style={{ width: '10%' }} pt={{
            bodyCell:{ className:"text-right"}
        }}></Column>
    <Column field="execution" header="EXECUTION" body={executionTemplate} style={{ width: '5%' }} ></Column>
</DataTable>
<Modal title="SITUATION EXECUTION" open={isModalOpen} okButtonProps={{className:"bg-blue-400"}} onOk={generateRapport} onCancel={handleCancel} zIndex={98}>
        <form onSubmit={(e) => e.preventDefault()}>
            <DatePickerInput
          type="range"
          label="LA PERIODE"
          placeholder="choisisser la periode"
         {...form.getInputProps('range')}
         locale="fr"
        />
        </form>
      </Modal>
    </>
  )
}

export default Gestions