import express from 'express'
import 'dotenv/config'

const app = express()
const PORT = process.env.PORT || 3000 // necesario para que se recupera  las  variables  de entorno

const LIMITE_CONSULTAS = 4
const TIEMPO_ESPERA = 60 * 1000 // 1 minuto en milisegundos
const  registroVisitantes = new Map() //Map funciona de  forma  similar  a  un json

//funncion  limitadora
const  rateLimiter = (req, res, next) => {
    const  ip  = req.ip //recuperamos  la ip del  visitante
    console.log(ip,"  ip  del  visitante")
    const ahora = Date.now() //  segundos  pasados  desde  1970

    console.log(ahora," tiempo  contado  en   milisegundos  desde    1970")
    
    let visitante = registroVisitantes.get(ip)// intenta  recuperar  el  registro  del  visitante  por  su  ip

    //si no  existe  el  registro  o  si  ya  paso  el  tiempo  de espera
    if(!visitante || ahora >= visitante.expiracion) {
        visitante = {
            count:0, // pone  el  contador  en  cero
            expiracion: ahora + TIEMPO_ESPERA // se  le  suma  a los  milisegundos  actuales el  tiempo de  espera
        }

        registroVisitantes.set(ip, visitante) //ingresamos  dentro  del map un  registro  sobre  el  visitante  y  su  ip
    }
    console.log(visitante)
    //incrementamos  el  contador  de  consultas
    visitante.count++

    //calculamos  los  segundos  que  faltan  para  que  se  reinicie  el  contador
    const segundos = Math.ceil((visitante.expiracion - ahora) / 1000) 

    res.set('RateLimit-Limit', LIMITE_CONSULTAS)
    res.set('RateLimit-Remaining', Math.max(0, LIMITE_CONSULTAS - visitante.count))
    res.set('RateLimit-Reset', segundos)
    
    if(visitante.count > LIMITE_CONSULTAS) {
        return res.status(429).send(`Demasiadas solicitudes. Intenta de nuevo en ${segundos} segundos.`)
    }    
    next()   
}
// Esta linea  es  para  indicarle  que  que  connfie
// en el proxy  delante  en  render
app.set('trust proxy', 3) 
app.use(rateLimiter)//aca usamos  el  rate-limit

app.get('/debug/ip', (req, res) => {
  res.json({
    ip: req.ip,

  })
})

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.get('/consulta', (req, res) => {

  res.send(`te quedan 
            ${LIMITE_CONSULTAS - registroVisitantes.get(req.ip).count}
             solicitudes en este minuto`)
})

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})
