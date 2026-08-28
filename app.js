import express from 'express'
import 'dotenv/config'

const app = express()
const PORT = process.env.PORT || 3000

const LIMITE_CONSULTAS = 4
const TIEMPO_ESPERA = 60 * 1000 // 1 minuto en milisegundos
const  registroVisitantes = new Map()

const  rateLimiter = (req, res, next) => {
    const  ip  = req.ip
    console.log(ip,"  ip  del  visitante")
    const ahora = Date.now()

    console.log(ahora," tiempo  contado  en   milisegundos  desde    1970")
    

    let visitante = registroVisitantes.get(ip)

    if(!visitante || ahora >= visitante.expiracion) {
        visitante = {
            count:0,
            expiracion: ahora + TIEMPO_ESPERA
        }
        registroVisitantes.set(ip, visitante)
    }
    console.log(visitante)
    visitante.count++

    const segundos = Math.ceil((visitante.expiracion - ahora) / 1000) 

    res.set('RateLimit-Limit', LIMITE_CONSULTAS)
    res.set('RateLimit-Remaining', Math.max(0, LIMITE_CONSULTAS - visitante.count))
    res.set('RateLimit-Reset', segundos)
    
    if(visitante.count > LIMITE_CONSULTAS) {
        return res.status(429).send(`Demasiadas solicitudes. Intenta de nuevo en ${segundos} segundos.`)
    }    
    next()   
}

app.use(rateLimiter)

app.get('/debug/ip', (req, res) => {
  res.json({
    ip: req.ip,
    forwardedFor: req.headers['x-forwarded-for'],
    ips: req.ips,
  });
});

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
