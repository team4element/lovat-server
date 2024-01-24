import { Request, Response } from "express";
import prismaClient from '../../../prismaClient'
import z from 'zod'
import { AuthenticatedRequest } from "../../../lib/middleware/requireAuth";
import { driverAbility, highNoteMap, matchTimeEnd, metricToEvent, stageMap } from "../analysisConstants";
import { autoPathSingleMatchSingleScouter } from "../autoPaths/autoPathSingleMatchSingleScouter";
import { singleMatchSingleScouter } from "./singleMatchSingleScouter";
import { cooperationSingleMatch } from "./cooperationSingleMatch";
// import { cooperationSingleMatch } from "./cooperationSingleMatch";


export const singleMatchEventsAverage = async (req: AuthenticatedRequest,  isPointAverage: boolean, matchKey: string, team: number, metric1 : string, timeMin: number = 0, timeMax : number = matchTimeEnd): Promise<number> => {
    try {
        const scoutReports = await prismaClient.scoutReport.findMany({
            where :
            {
                teamMatchKey : matchKey,
                teamMatchData :
                {
                    tournamentKey : {
                        in : req.user.tournamentSource
                    },
                    teamNumber : team
                },
                scouter :
                {
                    sourceTeamNumber : 
                    {
                        in : req.user.teamSource
                    }
                }
                
            }
        })
        if(scoutReports.length === 0)
        {
            return null
        }
        else
        {
            let matchDataArray = []

            for(const element of scoutReports)
            {
                let data = null
                if(metric1 === "coooperation")
                {
                    data = await cooperationSingleMatch(req, matchKey, team)
                }
                else
                {
                    data = await singleMatchSingleScouter(req, isPointAverage, matchKey, metric1, element.scouterUuid, timeMin, timeMax)
                }
                if(data !== null)
                {
                    matchDataArray.push(data)
                }
            }
          return matchDataArray.reduce((acc, val) => acc + val, 0) / matchDataArray.length;

        }
    }
    catch (error) {
        console.error(error)
        throw (error)
    }

};